"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrgContext, assertWritable, assertAdmin, setActiveOrganization } from "@/server/tenancy";
import { createSite, deleteSite, pauseSite, queueManualCheck, getSiteForOrg } from "@/features/sites/service";
import { acknowledgeIncident, ignoreIncident, resolveIncident } from "@/features/incidents/service";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { jobs, monitors, sites, visualSnapshots, organizations, users, alertChannels, sessions } from "@/db/schema";
import { writeAudit } from "@/server/audit";
import { INTERVALS_SECONDS } from "@/lib/constants";
import { minIntervalForMonitor, canUseEmailAlerts, canUseBrowserMonitoring } from "@/lib/plans";
import { isValidDiscordWebhookUrl } from "@/lib/discord";
import { logger } from "@/lib/logger";
import { newId } from "@/lib/ids";
import { cssSelectorSchema, emailSchema, nameSchema, orgNameSchema, orgRoleSchema, passwordSchema, slugSchema } from "@/validation";
import {
  changeRole,
  inviteMember,
  leaveOrganization,
  removeMember,
  revokeInvitation,
  transferOwnership,
  renameOrganization,
  memberCount,
} from "@/features/team/service";
import { findOrganizationsForUser } from "@/server/organizations";
import { createApiKey, revokeApiKey } from "@/features/api-keys/service";
import { createCheckoutSession, createPortalSession } from "@/billing/stripe";
import type { PlanId } from "@/lib/plans";
import { auth } from "@/auth";
import { headers } from "next/headers";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function actionCreateSite(formData: FormData) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const url = formString(formData, "url");
  const name = formString(formData, "name") || undefined;
  const siteId = await createSite(ctx, url, name);
  revalidatePath("/sites");
  redirect(`/sites/${siteId}?onboarding=1`);
}

export async function actionRunCheck(siteId: string) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const site = await getSiteForOrg(ctx.organizationId, siteId);
  if (!site) throw new Error("Site not found.");
  const jobIds = await queueManualCheck(ctx, siteId);
  revalidatePath(`/sites/${siteId}`);
  return { queued: true, jobIds };
}

export async function actionJobStatus(jobIds: string[]) {
  const ctx = await requireOrgContext();
  if (!jobIds.length) return [];
  const rows = await db
    .select({ id: jobs.id, status: jobs.status, lastError: jobs.lastError })
    .from(jobs)
    .where(and(eq(jobs.organizationId, ctx.organizationId), inArray(jobs.id, jobIds.slice(0, 20))));
  return rows;
}

export async function actionPauseSite(siteId: string, paused: boolean) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  await pauseSite(ctx, siteId, paused);
  revalidatePath(`/sites/${siteId}`);
}

export async function actionDeleteSite(siteId: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await deleteSite(ctx, siteId);
  revalidatePath("/sites");
  redirect("/sites");
}

export async function actionUpdateSite(siteId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const name = nameSchema.parse(formString(formData, "name"));
  const sensitivity = z.enum(["LOW", "MEDIUM", "HIGH"]).parse(formString(formData, "visualSensitivity"));
  await db
    .update(sites)
    .set({
      name,
      visualSensitivity: sensitivity,
      statusPageVisible: formData.get("statusPageVisible") === "on",
      updatedAt: new Date(),
    })
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, ctx.organizationId)));
  revalidatePath(`/sites/${siteId}`);
}

export async function actionUpdateMonitor(monitorId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const enabled = formString(formData, "enabled") === "on";
  const intervalKey = formString(formData, "interval") as keyof typeof INTERVALS_SECONDS;
  const seconds = INTERVALS_SECONDS[intervalKey];
  if (!seconds) throw new Error("Invalid interval.");
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.id, monitorId), eq(monitors.organizationId, ctx.organizationId)))
    .limit(1);
  if (!monitor) throw new Error("Monitor not found.");
  if (monitor.type !== "HTTP" && !canUseBrowserMonitoring(ctx.plan.id)) {
    throw new Error("Browser monitors require Freelancer or above.");
  }
  const min = minIntervalForMonitor(ctx.plan.id, monitor.type as "HTTP");
  if (seconds < min) throw new Error("That interval is not available on your plan.");
  await db
    .update(monitors)
    .set({ enabled, intervalSeconds: seconds, updatedAt: new Date() })
    .where(eq(monitors.id, monitorId));
  revalidatePath(`/sites/${monitor.siteId}`);
}

export async function actionAddElementMonitor(siteId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const site = await getSiteForOrg(ctx.organizationId, siteId);
  if (!site) throw new Error("Site not found.");
  if (!canUseBrowserMonitoring(ctx.plan.id)) {
    throw new Error("Element monitors require Freelancer or above.");
  }
  const selector = formString(formData, "selector");
  const expectedText = formString(formData, "expectedText") || null;
  if (selector) cssSelectorSchema.parse(selector);
  if (!selector && !expectedText) throw new Error("Provide a selector or expected text.");
  const now = new Date();
  const { newId } = await import("@/lib/ids");
  await db.insert(monitors).values({
    id: newId(),
    organizationId: ctx.organizationId,
    siteId,
    type: "ELEMENT",
    name: expectedText ? `Text: ${expectedText.slice(0, 40)}` : `Selector: ${selector.slice(0, 40)}`,
    enabled: true,
    intervalSeconds: minIntervalForMonitor(ctx.plan.id, "ELEMENT"),
    nextRunAt: now,
    selector: selector || null,
    expectedText,
    viewport: "desktop",
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath(`/sites/${siteId}`);
}

export async function actionIncident(intent: string, incidentId: string) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  if (intent === "ack") await acknowledgeIncident(incidentId, ctx.organizationId, ctx.userId);
  if (intent === "resolve") await resolveIncident(incidentId, ctx.organizationId, "Resolved manually.", ctx.userId);
  if (intent === "ignore") await ignoreIncident(incidentId, ctx.organizationId, ctx.userId);
  revalidatePath("/incidents");
}

export async function actionAcceptBaseline(snapshotId: string, siteId: string) {
  const ctx = await requireOrgContext();
  assertWritable(ctx);
  const [snapshot] = await db
    .select()
    .from(visualSnapshots)
    .where(
      and(
        eq(visualSnapshots.id, snapshotId),
        eq(visualSnapshots.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  if (!snapshot) throw new Error("Snapshot not found.");
  if (snapshot.siteId !== siteId) throw new Error("Snapshot does not belong to this site.");
  await db.transaction(async (tx) => {
    await tx
      .update(visualSnapshots)
      .set({ isBaseline: false })
      .where(
        and(
          eq(visualSnapshots.monitorId, snapshot.monitorId),
          eq(visualSnapshots.organizationId, ctx.organizationId),
          eq(visualSnapshots.viewport, snapshot.viewport),
        ),
      );
    await tx
      .update(visualSnapshots)
      .set({ isBaseline: true })
      .where(eq(visualSnapshots.id, snapshot.id));
  });
  await writeAudit({
    action: "baseline.changed",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetType: "snapshot",
    targetId: snapshotId,
  });
  revalidatePath(`/sites/${siteId}`);
}

export async function actionSwitchOrg(organizationId: string) {
  const ctx = await requireOrgContext(organizationId);
  await setActiveOrganization(ctx.organizationId);
  redirect("/overview");
}

export async function actionRenameWorkspace(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  const name = orgNameSchema.parse(formString(formData, "name"));
  const timezone = formString(formData, "timezone") || "UTC";
  const billingEmail = formString(formData, "billingEmail");
  await renameOrganization(ctx, name);
  await db
    .update(organizations)
    .set({
      timezone,
      billingEmail: billingEmail || null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, ctx.organizationId));
  revalidatePath("/settings");
}

export async function actionUpdateAlertSettings(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await db
    .update(organizations)
    .set({
      alertOnIncident: formData.get("alertOnIncident") === "on",
      alertOnRecovery: formData.get("alertOnRecovery") === "on",
      monthlyReportsEnabled: formData.get("monthlyReportsEnabled") === "on",
      minAlertSeverity: formString(formData, "minAlertSeverity") || "LOW",
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, ctx.organizationId));
  revalidatePath("/settings");
}

export async function actionUpdateStatusPage(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  const enabled = formData.get("statusPageEnabled") === "on";
  const rawSlug = formString(formData, "statusPageSlug");
  const rawHeadline = formString(formData, "statusPageHeadline");
  const statusPageSlug = rawSlug || enabled ? slugSchema.parse(rawSlug) : null;
  const statusPageHeadline = rawHeadline
    ? z.string().trim().max(160, "Headline is too long").parse(rawHeadline)
    : null;
  if (statusPageSlug) {
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.statusPageSlug, statusPageSlug), ne(organizations.id, ctx.organizationId)))
      .limit(1);
    if (existing[0]) {
      throw new Error("That status page URL is already taken.");
    }
  }
  await db
    .update(organizations)
    .set({
      statusPageEnabled: enabled,
      statusPageSlug,
      statusPageHeadline,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, ctx.organizationId));
  revalidatePath("/settings");
}

export async function actionInvite(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await inviteMember(ctx, formString(formData, "email"), orgRoleSchema.parse(formString(formData, "role")));
  revalidatePath("/team");
}

export async function actionRevokeInvite(id: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await revokeInvitation(ctx, id);
  revalidatePath("/team");
}

export async function actionRemoveMember(id: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await removeMember(ctx, id);
  revalidatePath("/team");
}

export async function actionChangeRole(id: string, role: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await changeRole(ctx, id, orgRoleSchema.parse(role));
  revalidatePath("/team");
}

export async function actionLeave() {
  const ctx = await requireOrgContext();
  await leaveOrganization(ctx);
  redirect("/overview");
}

export async function actionTransfer(memberId: string) {
  const ctx = await requireOrgContext();
  if (ctx.role !== "OWNER") throw new Error("Only the owner can transfer ownership.");
  await transferOwnership(ctx, memberId);
  revalidatePath("/team");
}

export async function actionCreateKey(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  const created = await createApiKey(ctx, nameSchema.parse(formString(formData, "name")));
  return created;
}

export async function actionRevokeKey(id: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await revokeApiKey(ctx, id);
  revalidatePath("/settings");
}

export async function actionCheckout(plan: PlanId) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  const url = await createCheckoutSession({
    organizationId: ctx.organizationId,
    organizationName: ctx.organizationName,
    billingEmail: ctx.userEmail,
    plan,
    userId: ctx.userId,
  });
  if (!url) throw new Error("Stripe did not return a checkout URL.");
  redirect(url);
}

export async function actionPortal() {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  const url = await createPortalSession(ctx.organizationId);
  redirect(url);
}

export async function actionUpdateAccount(formData: FormData) {
  const ctx = await requireOrgContext();
  const name = nameSchema.parse(formString(formData, "name"));
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, ctx.userId));
  await writeAudit({ action: "account.updated", actorUserId: ctx.userId });
}

export async function actionChangePassword(formData: FormData) {
  const ctx = await requireOrgContext();
  const current = formString(formData, "currentPassword");
  const next = passwordSchema.parse(formString(formData, "newPassword"));
  await auth.api.changePassword({
    body: { currentPassword: current, newPassword: next },
    headers: await headers(),
  });
  await writeAudit({ action: "password.changed", actorUserId: ctx.userId });
}

export async function actionSignOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function actionRevokeSession(sessionId: string) {
  const ctx = await requireOrgContext();
  await db.delete(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, ctx.userId)));
  revalidatePath("/settings");
}

export async function actionDeleteAccount() {
  const ctx = await requireOrgContext();
  const memberships = await findOrganizationsForUser(ctx.userId);
  const owned = memberships.filter((item) => item.role === "OWNER");
  for (const org of owned) {
    const n = await memberCount(org.id);
    if (n > 1) {
      throw new Error("Transfer ownership of every workspace before deleting your account.");
    }
  }
  const { cancelStripeSubscription } = await import("@/billing/stripe");
  for (const org of owned) {
    await cancelStripeSubscription(org.id);
  }
  await db.transaction(async (tx) => {
    for (const org of owned) {
      await tx.delete(organizations).where(eq(organizations.id, org.id));
    }
    await tx.delete(users).where(eq(users.id, ctx.userId));
  });
  const { getStorage } = await import("@/storage");
  const storage = getStorage();
  for (const org of owned) {
    try {
      await storage.deletePrefix(org.id);
    } catch (error) {
      logger.error({ err: error, organizationId: org.id }, "account delete: storage cleanup failed");
    }
  }
  await writeAudit({ action: "account.deleted", actorUserId: ctx.userId });
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function actionCreateWorkspace(formData: FormData) {
  const ctx = await requireOrgContext();
  const name = orgNameSchema.parse(formString(formData, "name"));
  const { createOrganizationForUser } = await import("@/server/organizations");
  const org = await createOrganizationForUser({
    userId: ctx.userId,
    name,
    email: ctx.userEmail,
  });
  await setActiveOrganization(org.id);
  redirect("/overview");
}

export async function actionAddDiscordWebhook(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  if (!canUseEmailAlerts(ctx.plan.id)) {
    throw new Error("Alerts require Freelancer or above.");
  }
  const url = formString(formData, "webhookUrl");
  if (!isValidDiscordWebhookUrl(url)) {
    throw new Error("Enter a valid Discord webhook URL.");
  }
  await db.insert(alertChannels).values({
    id: newId(),
    organizationId: ctx.organizationId,
    type: "DISCORD_WEBHOOK",
    name: "Discord",
    destination: url,
    enabled: true,
    createdAt: new Date(),
  });
  revalidatePath("/settings");
}

export async function actionAddEmailChannel(formData: FormData) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  if (!canUseEmailAlerts(ctx.plan.id)) {
    throw new Error("Alerts require Freelancer or above.");
  }
  const email = emailSchema.parse(formString(formData, "email")).toLowerCase();
  await db.insert(alertChannels).values({
    id: newId(),
    organizationId: ctx.organizationId,
    type: "EMAIL",
    name: "Email",
    destination: email,
    enabled: true,
    createdAt: new Date(),
  });
  revalidatePath("/settings");
}

export async function actionDeleteAlertChannel(channelId: string) {
  const ctx = await requireOrgContext();
  assertAdmin(ctx);
  await db
    .delete(alertChannels)
    .where(and(eq(alertChannels.id, channelId), eq(alertChannels.organizationId, ctx.organizationId)));
  revalidatePath("/settings");
}
