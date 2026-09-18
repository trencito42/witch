import "server-only";
import { and, avg, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks, monitors, reports, reportItems, sites } from "@/db/schema";
import { newId } from "@/lib/ids";
import { canUseReports } from "@/lib/plans";
import { getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { enqueueJob } from "@/server/jobs";
import { sendMonthlyReportEmail } from "@/emails/send";
import { appUrl, emailEnabled } from "@/lib/env";
import { organizations } from "@/db/schema";

export async function computeSiteMetrics(
  organizationId: string,
  siteId: string,
  from: Date,
  to: Date,
) {
  const [checkStats] = await db
    .select({
      total: count(),
      successful: sql<number>`sum(case when ${monitorChecks.success} = 1 then 1 else 0 end)`,
      avgResponse: avg(monitorChecks.durationMs),
    })
    .from(monitorChecks)
    .innerJoin(monitors, eq(monitors.id, monitorChecks.monitorId))
    .where(
      and(
        eq(monitorChecks.organizationId, organizationId),
        eq(monitorChecks.siteId, siteId),
        eq(monitors.type, "HTTP"),
        gte(monitorChecks.createdAt, from),
        lte(monitorChecks.createdAt, to),
      ),
    );

  const [detectedStats] = await db
    .select({ value: count() })
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, organizationId),
        eq(incidents.siteId, siteId),
        gte(incidents.firstDetectedAt, from),
        lte(incidents.firstDetectedAt, to),
      ),
    );
  const [resolvedStats] = await db
    .select({ value: count() })
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, organizationId),
        eq(incidents.siteId, siteId),
        gte(incidents.resolvedAt, from),
        lte(incidents.resolvedAt, to),
      ),
    );

  const total = Number(checkStats?.total ?? 0);
  const successful = Number(checkStats?.successful ?? 0);
  const uptime = total === 0 ? 100 : (successful / total) * 100;
  return {
    checks: total,
    successful,
    failed: Math.max(0, total - successful),
    uptime: Number(uptime.toFixed(3)),
    averageResponseMs: Number(checkStats?.avgResponse ?? 0),
    incidentsDetected: Number(detectedStats?.value ?? 0),
    incidentsResolved: Number(resolvedStats?.value ?? 0),
  };
}

export async function computeOrgHttpMetrics(organizationId: string, from: Date, to: Date) {
  const [checkStats] = await db
    .select({
      total: count(),
      successful: sql<number>`sum(case when ${monitorChecks.success} = 1 then 1 else 0 end)`,
      avgResponse: avg(monitorChecks.durationMs),
    })
    .from(monitorChecks)
    .innerJoin(monitors, eq(monitors.id, monitorChecks.monitorId))
    .where(
      and(
        eq(monitorChecks.organizationId, organizationId),
        eq(monitors.type, "HTTP"),
        gte(monitorChecks.createdAt, from),
        lte(monitorChecks.createdAt, to),
      ),
    );
  const total = Number(checkStats?.total ?? 0);
  const successful = Number(checkStats?.successful ?? 0);
  const uptime = total === 0 ? 100 : (successful / total) * 100;
  return {
    uptime: Number(uptime.toFixed(3)),
    averageResponseMs: Number(checkStats?.avgResponse ?? 0),
  };
}

export async function generateMonthlyReports(now = new Date()) {
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const allSites = await db.select().from(sites);
  for (const site of allSites) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, site.organizationId))
      .limit(1);
    const plan = getPlanLimits(sub?.planId ?? "free");
    if (!canUseReports(plan.id)) continue;
    const metrics = await computeSiteMetrics(
      site.organizationId,
      site.id,
      periodStart,
      periodEnd,
    );
    const title = `${site.name} · ${periodStart.toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" })}`;
    const id = newId();
    try {
      await db.insert(reports).values({
        id,
        organizationId: site.organizationId,
        siteId: site.id,
        periodStart,
        periodEnd,
        title,
        metrics: { ...metrics, sslHealth: "checked via HTTP monitors", currentStatus: site.status },
        createdAt: new Date(),
      });
    } catch {
      continue;
    }
    const items: [string, string][] = [
      ["Uptime (HTTP)", `${metrics.uptime.toFixed(2)}%`],
      ["HTTP checks", String(metrics.checks)],
      ["Incidents detected", String(metrics.incidentsDetected)],
      ["Incidents resolved", String(metrics.incidentsResolved)],
      ["Average response", `${Math.round(metrics.averageResponseMs)} ms`],
      ["Current status", site.status],
    ];
    for (const [label, value] of items) {
      await db.insert(reportItems).values({
        id: newId(),
        reportId: id,
        label,
        value,
      });
    }
    if (emailEnabled()) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, site.organizationId))
        .limit(1);
      if (org?.monthlyReportsEnabled && org.billingEmail) {
        await enqueueJob({
          type: "EMAIL_ALERT",
          organizationId: org.id,
          siteId: site.id,
          payload: { kind: "monthly-report", reportId: id, to: org.billingEmail, title },
        });
      }
    }
  }
}

export async function sendReportEmail(to: string, title: string, reportId: string) {
  await sendMonthlyReportEmail({
    to,
    title,
    reportUrl: `${appUrl()}/reports/${reportId}`,
  });
}
