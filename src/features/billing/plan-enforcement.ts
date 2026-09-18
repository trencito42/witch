import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { monitors, sites } from "@/db/schema";
import {
  getPlanLimits,
  minIntervalForMonitor,
  type PlanId,
} from "@/lib/plans";

export async function applyPlanLimits(organizationId: string, planId: PlanId) {
  const plan = getPlanLimits(planId);
  const orgSites = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, organizationId));
  const ordered = [...orgSites].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  for (const [index, site] of ordered.entries()) {
    if (index >= plan.maxSites && !site.pausedAt) {
      await db
        .update(sites)
        .set({ pausedAt: new Date(), updatedAt: new Date() })
        .where(eq(sites.id, site.id));
    }
  }

  const orgMonitors = await db
    .select()
    .from(monitors)
    .where(eq(monitors.organizationId, organizationId));
  for (const monitor of orgMonitors) {
    const type =
      monitor.type === "HTTP"
        ? "HTTP"
        : monitor.type === "ELEMENT"
          ? "ELEMENT"
          : monitor.viewport === "mobile"
            ? "BROWSER_MOBILE"
            : "BROWSER_DESKTOP";
    const min = minIntervalForMonitor(plan.id, type);
    const next: { intervalSeconds?: number; enabled?: boolean; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (monitor.intervalSeconds < min) next.intervalSeconds = min;
    if (monitor.type !== "HTTP" && !plan.browserMonitoring && monitor.enabled) {
      next.enabled = false;
    }
    if (next.intervalSeconds != null || next.enabled === false) {
      await db.update(monitors).set(next).where(eq(monitors.id, monitor.id));
    }
  }
}
