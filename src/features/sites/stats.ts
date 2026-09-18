import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, getPool } from "@/db";
import { incidents } from "@/db/schema";

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

  const placeholders = siteIds.map(() => "?").join(",");
  const [rows] = await getPool().query(
    `SELECT site_id AS siteId, duration_ms AS durationMs, created_at AS createdAt
     FROM (
       SELECT site_id, duration_ms, created_at,
         ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY created_at DESC) AS rn
       FROM monitor_check
       WHERE organization_id = ? AND site_id IN (${placeholders})
     ) ranked
     WHERE rn = 1`,
    [organizationId, ...siteIds],
  );

  for (const row of Array.isArray(rows) ? (rows as { siteId: string; durationMs: number | null; createdAt: Date }[]) : []) {
    lastBySite.set(row.siteId, { durationMs: row.durationMs, createdAt: row.createdAt });
  }

  return { openBySite, lastBySite };
}
