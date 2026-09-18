import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { incidentEvents, incidents, sites } from "@/db/schema";
import { newId } from "@/lib/ids";
import { enqueueJob } from "@/server/jobs";
import type { ClassifiedIssue } from "@/monitoring/classify";
import { aiEnabled } from "@/lib/env";

const SEVERITY_RANK: Record<string, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export async function applyIssues(input: {
  organizationId: string;
  siteId: string;
  monitorId: string;
  issues: ClassifiedIssue[];
  confirmUptime: boolean;
}) {
  const open = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, input.organizationId),
        eq(incidents.siteId, input.siteId),
        inArray(incidents.status, ["OPEN", "ACKNOWLEDGED"]),
      ),
    );

  const seen = new Set(input.issues.map((issue) => `${input.monitorId}:${issue.fingerprint}`));
  const recovered: typeof open = [];

  for (const incident of open) {
    if (incident.monitorId && incident.monitorId !== input.monitorId) continue;
    const fingerprint = incident.fingerprint.replace(`${input.monitorId}:`, "");
    const key = `${input.monitorId}:${fingerprint}`;
    if (!seen.has(key) && incident.monitorId === input.monitorId) {
      recovered.push(incident);
    }
  }

  const createdOrUpdated = [];
  for (const issue of input.issues) {
    if (issue.category === "UPTIME" && !input.confirmUptime) continue;
    const fingerprint = `${input.monitorId}:${issue.fingerprint}`;
    const existing = open.find((row) => row.fingerprint === fingerprint);
    if (existing) {
      await db
        .update(incidents)
        .set({
          lastDetectedAt: new Date(),
          occurrenceCount: existing.occurrenceCount + 1,
          summary: issue.summary,
          severity:
            SEVERITY_RANK[issue.severity] > SEVERITY_RANK[existing.severity]
              ? issue.severity
              : existing.severity,
          metadata: issue.metadata ?? existing.metadata,
          updatedAt: new Date(),
        })
        .where(eq(incidents.id, existing.id));
      await addEvent(existing.id, input.organizationId, "repeated", "Issue still present.");
      createdOrUpdated.push(existing.id);
      continue;
    }

    const id = newId();
    const now = new Date();
    await db.insert(incidents).values({
      id,
      organizationId: input.organizationId,
      siteId: input.siteId,
      monitorId: input.monitorId,
      fingerprint,
      category: issue.category,
      severity: issue.severity,
      title: issue.title.slice(0, 255),
      summary: issue.summary,
      status: "OPEN",
      firstDetectedAt: now,
      lastDetectedAt: now,
      occurrenceCount: 1,
      metadata: { evidence: issue.evidence, ...(issue.metadata ?? {}) },
      createdAt: now,
      updatedAt: now,
    });
    await addEvent(id, input.organizationId, "detected", issue.summary);
    await enqueueJob({
      type: "EMAIL_ALERT",
      organizationId: input.organizationId,
      siteId: input.siteId,
      incidentId: id,
      payload: { kind: "detected" },
    });
    if (aiEnabled()) {
      await enqueueJob({
        type: "AI_ANALYSIS",
        organizationId: input.organizationId,
        siteId: input.siteId,
        incidentId: id,
        payload: { evidence: issue.evidence },
        maxAttempts: 2,
      });
    }
    createdOrUpdated.push(id);
  }

  for (const incident of recovered) {
    await resolveIncident(incident.id, input.organizationId, "Automatically recovered.");
  }

  await refreshSiteStatus(input.siteId, input.organizationId);
  return createdOrUpdated;
}

export async function resolveIncident(
  incidentId: string,
  organizationId: string,
  message: string,
  actorUserId?: string,
) {
  const now = new Date();
  await db
    .update(incidents)
    .set({ status: "RESOLVED", resolvedAt: now, updatedAt: now })
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)));
  await addEvent(incidentId, organizationId, "resolved", message, actorUserId);
  await enqueueJob({
    type: "EMAIL_ALERT",
    organizationId,
    incidentId,
    payload: { kind: "resolved" },
  });
}

export async function acknowledgeIncident(
  incidentId: string,
  organizationId: string,
  actorUserId: string,
) {
  await db
    .update(incidents)
    .set({ status: "ACKNOWLEDGED", updatedAt: new Date() })
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)));
  await addEvent(incidentId, organizationId, "acknowledged", "Acknowledged.", actorUserId);
}

export async function ignoreIncident(
  incidentId: string,
  organizationId: string,
  actorUserId: string,
) {
  await db
    .update(incidents)
    .set({ status: "IGNORED", updatedAt: new Date() })
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, organizationId)));
  await addEvent(incidentId, organizationId, "ignored", "Ignored.", actorUserId);
}

async function addEvent(
  incidentId: string,
  organizationId: string,
  type: string,
  message: string,
  actorUserId?: string,
) {
  await db.insert(incidentEvents).values({
    id: newId(),
    incidentId,
    organizationId,
    type,
    message: message.slice(0, 1024),
    actorUserId: actorUserId ?? null,
    createdAt: new Date(),
  });
}

export async function refreshSiteStatus(siteId: string, organizationId: string) {
  const open = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.siteId, siteId),
        eq(incidents.organizationId, organizationId),
        inArray(incidents.status, ["OPEN", "ACKNOWLEDGED"]),
      ),
    );
  let status = "HEALTHY";
  if (open.some((item) => item.category === "UPTIME" && ["CRITICAL", "HIGH"].includes(item.severity))) {
    status = "DOWN";
  } else if (open.length) {
    status = "DEGRADED";
  }
  const patch: { status: string; updatedAt: Date; lastHealthyAt?: Date } = {
    status,
    updatedAt: new Date(),
  };
  if (status === "HEALTHY") patch.lastHealthyAt = new Date();
  await db
    .update(sites)
    .set(patch)
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)));
}
