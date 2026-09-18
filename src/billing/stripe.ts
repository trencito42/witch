import "server-only";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { billingEvents, subscriptions } from "@/db/schema";
import { getEnv, stripeEnabled, appUrl } from "@/lib/env";
import { PLANS, type PlanId } from "@/lib/plans";
import { newId } from "@/lib/ids";
import { writeAudit } from "@/server/audit";
import { logger } from "@/lib/logger";

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

export function planFromPriceId(priceId?: string | null): PlanId {
  const env = getEnv();
  if (!priceId) return "free";
  if (priceId === env.STRIPE_PRICE_FREELANCER) return "freelancer";
  if (priceId === env.STRIPE_PRICE_AGENCY) return "agency";
  if (priceId === env.STRIPE_PRICE_AGENCY_PRO) return "agency_pro";
  return "free";
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

  const session = await stripe.checkout.sessions.create({
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
  });
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

  const [existing] = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.stripeEventId, event.id))
    .limit(1);
  if (existing) return { ok: true, duplicate: true };

  await applyStripeEvent(event);

  await db.insert(billingEvents).values({
    id: newId(),
    stripeEventId: event.id,
    type: event.type,
    processedAt: new Date(),
    payloadSummary: { type: event.type, id: event.id },
  });
  return { ok: true };
}

async function applyStripeEvent(event: Stripe.Event) {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
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

    if (event.type === "checkout.session.completed") {
      const session = object as Stripe.Checkout.Session;
      customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
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
      currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null;
      currentPeriodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null;
      cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
    }

    const planId = planFromPriceId(priceId) || (object.metadata?.plan as PlanId) || "free";
    const effectivePlan = event.type === "customer.subscription.deleted" || status === "canceled"
      ? "free"
      : planId;

    await db
      .update(subscriptions)
      .set({
        planId: effectivePlan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        currentPeriodEnd,
        currentPeriodStart,
        cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.organizationId, organizationId));

    await writeAudit({
      action: "billing.updated",
      organizationId,
      targetType: "subscription",
      metadata: { event: event.type, plan: effectivePlan, status },
    });
  }
}

export { stripeEnabled, PLANS };
