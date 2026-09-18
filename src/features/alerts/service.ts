import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  aiUsages,
  alertChannels,
  alertDeliveries,
  incidents,
  organizations,
  sites,
} from "@/db/schema";
import { analyzeIncidentSafe } from "@/ai/provider";
import { newId } from "@/lib/ids";
import { appUrl } from "@/lib/env";
import { canUseEmailAlerts, getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { sendIncidentAlertEmail, sendRecoveryAlertEmail } from "@/emails/send";
import { emailEnabled } from "@/lib/env";
import { logger } from "@/lib/logger";

const SEVERITY_RANK: Record<string, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export async function processAiAnalysis(incidentId: string, organizationId: string) {
  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)))
    .limit(1);
  if (!incident) return;
  if (incident.aiAnalysis) return;
  const [site] = await db.select().from(sites).where(eq(sites.id, incident.siteId)).limit(1);
  const evidence = Array.isArray((incident.metadata as { evidence?: string[] } | null)?.evidence)
    ? ((incident.metadata as { evidence: string[] }).evidence)
    : [];
  const result = await analyzeIncidentSafe({
    siteUrl: site?.url ?? "",
    monitorType: incident.category,
    title: incident.title,
    summary: incident.summary,
    category: incident.category.toLowerCase(),
    evidence,
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

export async function processEmailAlert(incidentId: string, organizationId: string, kind: string) {
  if (!emailEnabled()) {
    logger.info({ incidentId, kind }, "email alert skipped");
    return;
  }
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  const plan = getPlanLimits(sub?.planId ?? "free");
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
    .where(
      and(
        eq(alertChannels.organizationId, organizationId),
        eq(alertChannels.type, "EMAIL"),
        eq(alertChannels.enabled, true),
      ),
    );

  const evidence = Array.isArray((incident.metadata as { evidence?: string[] } | null)?.evidence)
    ? (incident.metadata as { evidence: string[] }).evidence
    : [];
  const incidentUrl = `${appUrl()}/incidents/${incident.id}`;

  for (const channel of channels) {
    try {
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
      throw error;
    }
  }
}
