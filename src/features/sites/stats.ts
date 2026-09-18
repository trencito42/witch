import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks } from "@/db/schema";

const ACTIVE = ["OPEN", "ACKNOWLEDGED"] as const;

export async function loadSiteListStats(organizationId: string, siteIds: string[]) {
  const openBySite = new Map<string, number>();
  const lastBySite = new Map<string, { durationMs: number | null; createdAt: Date }>();
  if (!siteIds.length) return { openBySite, lastBySite };

  const openRows = await db
    .select({
      siteId: incidents.siteId,
      status: incidents.status,
    })
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, organizationId),
        inArray(incidents.siteId, siteIds),
        inArray(incidents.status, [...ACTIVE]),
      ),
    );

  for (const row of openRows) {
    openBySite.set(row.siteId, (openBySite.get(row.siteId) ?? 0) + 1);
  }

  const recent = await db
    .select({
      siteId: monitorChecks.siteId,
      durationMs: monitorChecks.durationMs,
      createdAt: monitorChecks.createdAt,
    })
    .from(monitorChecks)
    .where(and(eq(monitorChecks.organizationId, organizationId), inArray(monitorChecks.siteId, siteIds)))
    .orderBy(desc(monitorChecks.createdAt))
    .limit(2_000);

  for (const row of recent) {
    if (!lastBySite.has(row.siteId)) {
      lastBySite.set(row.siteId, { durationMs: row.durationMs, createdAt: row.createdAt });
    }
  }

  return { openBySite, lastBySite };
}
