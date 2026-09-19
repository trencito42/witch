import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aiUsages,
  alertChannels,
  alertDeliveries,
  incidents,
  organizations,
  sites,
  statusPageSubscribers,
} from "@/db/schema";
import { analyzeIncidentSafe } from "@/ai/provider";
import { newId } from "@/lib/ids";
import { appUrl } from "@/lib/env";
import { canUseAiAnalysis, canUseEmailAlerts, getEffectivePlan } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { sendIncidentAlertEmail, sendRecoveryAlertEmail, sendStatusIncidentSubscriberEmail, sendStatusRecoverySubscriberEmail } from "@/emails/send";
import { emailEnabled } from "@/lib/env";
import { isValidDiscordWebhookUrl, sendDiscordWebhook } from "@/lib/discord";
import { logger } from "@/lib/logger";\nimport { getEnv } from "@/lib/env";\nimport { statusSubscriptionToken } from "@/lib/crypto";

const SEVERITY_RANK: Record<string, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export async function processAiAnalysis(incidentId: string, organizationId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  if (!canUseAiAnalysis(getEffectivePlan(sub).id)) return;
  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)))
    .limit(1);
  if (!incident) return;
  if (incident.aiAnalysis) return;
  const [site] = await db.select().from(sites).where(eq(sites.id, incident.siteId)).limit(1);
  const meta = (incident.metadata ?? {}) as {
    evidence?: string[];
    boundingBox?: { x: number; y: number; width: number; height: number };
    differenceRatio?: number;
    filteredDifferenceRatio?: number;
    visualDiffId?: string;
  };
  const evidence = Array.isArray(meta.evidence) ? meta.evidence : [];
  const images =
    incident.category === "VISUAL"
      ? await visualEvidenceImages(incident.siteId, organizationId, incident.monitorId, meta.visualDiffId)
      : undefined;
  const result = await analyzeIncidentSafe({
    siteUrl: site?.url ?? "",
    monitorType: incident.category,
    title: incident.title,
    summary: incident.summary,
    category: incident.category.toLowerCase(),
    evidence,
    visualDifferenceRatio: meta.filteredDifferenceRatio ?? meta.differenceRatio,
    boundingBox: meta.boundingBox,
    observedFacts: evidence,
    images,
  });
  if (!result) return;
  await db
    .update(incidents)
    .set({ aiAnalysis: result.analysis, updatedAt: new Date() })
    .where(eq(incidents.id, incident.id));
  await db.insert(aiUsages).values({
    id: newId(),
    organizationId,
    incidentId,
    provider: result.usage?.provider ?? "unknown",
    model: result.usage?.model ?? "unknown",
    inputTokens: result.usage?.inputTokens ?? null,
    outputTokens: result.usage?.outputTokens ?? null,
    createdAt: new Date(),
  });
}

async function visualEvidenceImages(
  siteId: string,
  organizationId: string,
  monitorId: string | null,
  visualDiffId?: string | null,
) {
  const { visualDiffs, visualSnapshots } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  const [diff] = visualDiffId
    ? await db
        .select()
        .from(visualDiffs)
        .where(
          and(
            eq(visualDiffs.id, visualDiffId),
            eq(visualDiffs.organizationId, organizationId),
            eq(visualDiffs.siteId, siteId),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(visualDiffs)
        .where(
          monitorId
            ? and(
                eq(visualDiffs.siteId, siteId),
                eq(visualDiffs.organizationId, organizationId),
                eq(visualDiffs.monitorId, monitorId),
              )
            : and(eq(visualDiffs.siteId, siteId), eq(visualDiffs.organizationId, organizationId)),
        )
        .orderBy(desc(visualDiffs.createdAt))
        .limit(1);
  if (!diff) return undefined;
  const ids = [diff.baselineSnapshotId, diff.currentSnapshotId];
  const snaps = await db.select().from(visualSnapshots).where(inArray(visualSnapshots.id, ids));
  const byId = new Map(snaps.map((item) => [item.id, item]));
  const { getStorage } = await import("@/storage");
  const storage = getStorage();
  const baseline = byId.get(diff.baselineSnapshotId);
  const current = byId.get(diff.currentSnapshotId);
  const [baselineBytes, currentBytes, diffBytes] = await Promise.all([
    baseline ? storage.get(baseline.storageKey) : Promise.resolve(null),
    current ? storage.get(current.storageKey) : Promise.resolve(null),
    diff.diffStorageKey ? storage.get(diff.diffStorageKey) : Promise.resolve(null),
  ]);
  return {
    baseline: baselineBytes ?? undefined,
    current: currentBytes ?? undefined,
    diff: diffBytes ?? undefined,
  };
}

export async function processEmailAlert(incidentId: string, organizationId: string, kind: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  const plan = getEffectivePlan(sub);
  if (!canUseEmailAlerts(plan.id)) return;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)))
    .limit(1);
  if (!org || !incident) return;
  if (SEVERITY_RANK[incident.severity] < SEVERITY_RANK[org.minAlertSeverity ?? "LOW"]) return;
  if (kind === "detected" && !org.alertOnIncident) return;
  if (kind === "resolved" && !org.alertOnRecovery) return;

  const [site] = await db.select().from(sites).where(eq(sites.id, incident.siteId)).limit(1);
  const channels = await db
    .select()
    .from(alertChannels)
    .where(and(eq(alertChannels.organizationId, organizationId), eq(alertChannels.enabled, true)));

  const evidence = Array.isArray((incident.metadata as { evidence?: string[] } | null)?.evidence)
    ? (incident.metadata as { evidence: string[] }).evidence
    : [];
  const incidentUrl = `${appUrl()}/incidents/${incident.id}`;
  let emailError: Error | null = null;

  for (const channel of channels) {
    try {
      if (channel.type === "EMAIL") {
        if (!emailEnabled()) continue;
        if (kind === "resolved") {
          await sendRecoveryAlertEmail({
            to: channel.destination,
            siteName: site?.name ?? "Site",
            title: incident.title,
            incidentUrl,
          });
        } else {
          await sendIncidentAlertEmail({
            to: channel.destination,
            siteName: site?.name ?? "Site",
            siteUrl: site?.url ?? "",
            title: incident.title,
            severity: incident.severity,
            detectedAt: incident.firstDetectedAt.toISOString(),
            summary: incident.summary,
            evidence,
            incidentUrl,
          });
        }
      } else if (channel.type === "DISCORD_WEBHOOK") {
        if (!isValidDiscordWebhookUrl(channel.destination)) {
          throw new Error("Invalid Discord webhook URL");
        }
        await sendDiscordWebhook({
          webhookUrl: channel.destination,
          title: kind === "resolved" ? `Recovered: ${incident.title}` : incident.title,
          description: incident.summary,
          color: kind === "resolved" ? 0x3dd68c : 0xff5a36,
          url: incidentUrl,
          fields: [
            { name: "Site", value: site?.name ?? "Site", inline: true },
            { name: "Severity", value: incident.severity, inline: true },
            { name: "Evidence", value: evidence.slice(0, 4).join("\n") || "See incident" },
          ],
        });
      } else {
        continue;
      }
      await db.insert(alertDeliveries).values({
        id: newId(),
        organizationId,
        channelId: channel.id,
        incidentId,
        type: kind,
        status: "sent",
        createdAt: new Date(),
      });
    } catch (error) {
      await db.insert(alertDeliveries).values({
        id: newId(),
        organizationId,
        channelId: channel.id,
        incidentId,
        type: kind,
        status: "failed",
        errorMessage: error instanceof Error ? error.message.slice(0, 512) : "send failed",
        createdAt: new Date(),
      });
      if (channel.type === "EMAIL") {
        emailError = error instanceof Error ? error : new Error("send failed");
      } else {
        logger.warn({ channelId: channel.id, kind }, "discord webhook delivery failed");
      }
    }
  }

  if (
    emailEnabled() &&
    org.statusPageEnabled &&
    org.statusPageAllowSubscribe &&
    org.statusPageSlug
  ) {
    const subscribers = await db
      .select()
      .from(statusPageSubscribers)
      .where(
        and(
          eq(statusPageSubscribers.organizationId, organizationId),
          sql`${statusPageSubscribers.confirmedAt} IS NOT NULL`,
        ),
      );

    const statusUrl = `${appUrl()}/status/${org.statusPageSlug}`;
    for (const subscriber of subscribers) {
      const unsubscribeToken = statusSubscriptionToken({
        subscriberId: subscriber.id,
        organizationId,
        email: subscriber.email,
        purpose: "unsubscribe",
        secret: getEnv().AUTH_SECRET,
      });
      const unsubscribeUrl =
        `${appUrl()}/status/subscribe/unsubscribe?id=${encodeURIComponent(subscriber.id)}&token=${encodeURIComponent(unsubscribeToken)}`;

      try {
        if (kind === "resolved") {
          await sendStatusRecoverySubscriberEmail({
            to: subscriber.email,
            organizationName: org.name,
            siteName: site?.name ?? "Site",
            title: incident.title,
            statusUrl,
            unsubscribeUrl,
          });
        } else {
          await sendStatusIncidentSubscriberEmail({
            to: subscriber.email,
            organizationName: org.name,
            siteName: site?.name ?? "Site",
            title: incident.title,
            summary: incident.summary,
            statusUrl,
            unsubscribeUrl,
          });
        }
      } catch (error) {
        logger.warn(
          { err: error, subscriberId: subscriber.id, incidentId, kind },
          "public status subscriber delivery failed",
        );
      }
    }
  }

  if (emailError) throw emailError;
}
