import "server-only";
import Stripe from "stripe";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { billingEvents, subscriptions } from "@/db/schema";
import { getEnv, stripeEnabled, appUrl } from "@/lib/env";
import { entitledPlanId, type PlanId } from "@/lib/plans";
import { applyPlanLimits } from "@/features/billing/plan-enforcement";
import { newId } from "@/lib/ids";
import { writeAudit } from "@/server/audit";
import { logger } from "@/lib/logger";
import { planFromPriceId as matchPriceId, resolveStripePlan as matchStripePlan } from "@/lib/stripe-plan";

function stripeClient() {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function priceIdForPlan(plan: PlanId) {
  const env = getEnv();
  if (plan === "freelancer") return env.STRIPE_PRICE_FREELANCER;
  if (plan === "agency") return env.STRIPE_PRICE_AGENCY;
  if (plan === "agency_pro") return env.STRIPE_PRICE_AGENCY_PRO;
  return undefined;
}

function priceCatalog() {
  const env = getEnv();
  return {
    freelancer: env.STRIPE_PRICE_FREELANCER,
    agency: env.STRIPE_PRICE_AGENCY,
    agencyPro: env.STRIPE_PRICE_AGENCY_PRO,
  };
}

export function planFromPriceId(priceId?: string | null): PlanId | null {
  return matchPriceId(priceId, priceCatalog());
}

export function resolveStripePlan(input: {
  priceId?: string | null;
  metadataPlan?: string | null;
}): PlanId {
  return matchStripePlan({ ...input, catalog: priceCatalog() });
}

export async function createCheckoutSession(input: {
  organizationId: string;
  organizationName: string;
  billingEmail: string;
  plan: PlanId;
  userId: string;
}) {
  const stripe = stripeClient();
  const price = priceIdForPlan(input.plan);
  if (!stripe || !price) {
    throw new Error("Billing is not configured yet.");
  }
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .limit(1);
  const hasLiveSubscription =
    Boolean(sub?.stripeSubscriptionId) &&
    ["active", "trialing", "past_due"].includes(sub?.status ?? "");
  if (hasLiveSubscription) {
    return createPortalSession(input.organizationId);
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: sub?.stripeCustomerId ?? undefined,
      customer_email: sub?.stripeCustomerId ? undefined : input.billingEmail,
      client_reference_id: input.organizationId,
      success_url: `${appUrl()}/settings/billing?checkout=success`,
      cancel_url: `${appUrl()}/settings/billing?checkout=cancelled`,
      line_items: [{ price, quantity: 1 }],
      metadata: {
        organizationId: input.organizationId,
        plan: input.plan,
        userId: input.userId,
      },
      subscription_data: {
        metadata: {
          organizationId: input.organizationId,
          plan: input.plan,
        },
      },
    },
    { idempotencyKey: `witch-checkout-${input.organizationId}-${input.plan}` },
  );
  return session.url;
}

export async function createPortalSession(organizationId: string) {
  const stripe = stripeClient();
  if (!stripe) throw new Error("Billing is not configured yet.");
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  if (!sub?.stripeCustomerId) throw new Error("No Stripe customer is on file.");
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl()}/settings/billing`,
  });
  return portal.url;
}

export async function cancelStripeSubscription(organizationId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  if (!sub?.stripeSubscriptionId || ["canceled", "incomplete_expired"].includes(sub.status)) {
    return;
  }
  const stripe = stripeClient();
  if (!stripe) {
    throw new Error("Cannot cancel billing: Stripe is not configured.");
  }
  await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
}

export async function handleStripeWebhook(rawBody: string, signature: string) {
  const env = getEnv();
  const stripe = stripeClient();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured");
  }
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  const eventRowId = newId();
  try {
    await db.insert(billingEvents).values({
      id: eventRowId,
      stripeEventId: event.id,
      type: event.type,
      processedAt: new Date(),
      payloadSummary: { type: event.type, id: event.id, created: event.created },
    });
  } catch (error) {
    const code = (error as { code?: string; errno?: number }).code;
    const errno = (error as { errno?: number }).errno;
    if (code === "ER_DUP_ENTRY" || errno === 1062) {
      return { ok: true, duplicate: true };
    }
    throw error;
  }

  try {
    await applyStripeEvent(event);
  } catch (error) {
    await db.delete(billingEvents).where(eq(billingEvents.id, eventRowId));
    throw error;
  }
  return { ok: true };
}

async function applyStripeEvent(event: Stripe.Event) {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return;
  }

  const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
  const organizationId =
    ("metadata" in object && object.metadata?.organizationId) ||
    ("client_reference_id" in object && object.client_reference_id) ||
    null;
  if (!organizationId) {
    logger.warn({ type: event.type }, "stripe event missing organization");
    return;
  }

  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  let priceId: string | null = null;
  let status = "active";
  let currentPeriodEnd: Date | null = null;
  let currentPeriodStart: Date | null = null;
  let cancelAtPeriodEnd = false;

  const metadataPlan =
    ("metadata" in object && object.metadata?.plan) ||
    (event.type === "checkout.session.completed"
      ? (object as Stripe.Checkout.Session).metadata?.plan
      : null);

  if (event.type === "checkout.session.completed") {
    const session = object as Stripe.Checkout.Session;
    customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    if (subscriptionId && stripeEnabled()) {
      const stripe = stripeClient();
      if (stripe) {
        const remote = await stripe.subscriptions.retrieve(subscriptionId);
        priceId = remote.items.data[0]?.price.id ?? null;
        status = remote.status;
        const remotePeriod = remote as Stripe.Subscription & {
          current_period_end?: number;
          current_period_start?: number;
        };
        currentPeriodEnd = remotePeriod.current_period_end
          ? new Date(remotePeriod.current_period_end * 1000)
          : null;
        currentPeriodStart = remotePeriod.current_period_start
          ? new Date(remotePeriod.current_period_start * 1000)
          : null;
      }
    }
  } else {
    const sub = object as Stripe.Subscription & {
      current_period_end?: number;
      current_period_start?: number;
      cancel_at_period_end?: boolean;
    };
    customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    subscriptionId = sub.id;
    priceId = sub.items.data[0]?.price.id ?? null;
    status = sub.status;
    currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
    currentPeriodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null;
    cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  }

  const planId = resolveStripePlan({ priceId, metadataPlan });
  const storedPlan =
    event.type === "customer.subscription.deleted" || status === "canceled" ? "free" : planId;
  const effectivePlan = entitledPlanId(storedPlan, status);

  let applied = false;
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT id FROM subscription WHERE organization_id = ${organizationId} FOR UPDATE`,
    );
    const [existingSub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);
    if (
      existingSub?.lastStripeEventCreated &&
      event.created < existingSub.lastStripeEventCreated
    ) {
      logger.warn(
        { type: event.type, created: event.created, latest: existingSub.lastStripeEventCreated },
        "skipping stale stripe event",
      );
      return;
    }

    await tx
      .update(subscriptions)
      .set({
        planId: storedPlan,
        status,
        stripeCustomerId: customerId ?? existingSub?.stripeCustomerId,
        stripeSubscriptionId: subscriptionId ?? existingSub?.stripeSubscriptionId,
        stripePriceId: priceId ?? existingSub?.stripePriceId,
        currentPeriodEnd: currentPeriodEnd ?? existingSub?.currentPeriodEnd,
        currentPeriodStart: currentPeriodStart ?? existingSub?.currentPeriodStart,
        cancelAtPeriodEnd,
        lastStripeEventCreated: event.created,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.organizationId, organizationId),
          or(
            isNull(subscriptions.lastStripeEventCreated),
            lte(subscriptions.lastStripeEventCreated, event.created),
          ),
        ),
      );
    applied = true;
  });

  if (!applied) return;
  await applyPlanLimits(organizationId);
  await writeAudit({
    action: "billing.updated",
    organizationId,
    targetType: "subscription",
    metadata: { event: event.type, plan: storedPlan, status, entitled: effectivePlan },
  });
}

export { stripeEnabled };
export { PLANS } from "@/lib/plans";
