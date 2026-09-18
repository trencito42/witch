import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { jobs, monitors, sites } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assertPublicHttpUrl, hostnameFromUrl, normalizeHttpUrl } from "@/lib/safe-url";
import { canCreateSite, canUseBrowserMonitoring, minIntervalForMonitor } from "@/lib/plans";
import { enqueueJob, hasActiveJob } from "@/server/jobs";
import { writeAudit } from "@/server/audit";
import type { OrgContext } from "@/server/tenancy";
import { MANUAL_CHECK_COOLDOWN_SECONDS } from "@/lib/constants";
import { enforceRateLimit } from "@/lib/rate-limit";

function siteNameFromUrl(url: string) {
  try {
    return hostnameFromUrl(url).replace(/^www\./, "");
  } catch {
    return "Site";
  }
}

export async function createSite(ctx: OrgContext, rawUrl: string, name?: string) {
  const current = await db
    .select({ value: count() })
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId));
  if (!canCreateSite(ctx.plan.id, Number(current[0]?.value ?? 0))) {
    throw new Error(`The ${ctx.plan.name} plan allows ${ctx.plan.maxSites} site(s).`);
  }

  await enforceRateLimit({
    key: `site-create:${ctx.organizationId}`,
    limit: 10,
    windowSeconds: 3600,
  });

  const normalized = normalizeHttpUrl(rawUrl);
  await assertPublicHttpUrl(normalized);
  const now = new Date();
  const siteId = newId();
  const siteName = name?.trim() || siteNameFromUrl(normalized);

  await db.insert(sites).values({
    id: siteId,
    organizationId: ctx.organizationId,
    name: siteName,
    url: normalized,
    normalizedUrl: normalized,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostnameFromUrl(normalized))}&sz=64`,
    status: "UNKNOWN",
    createdAt: now,
    updatedAt: now,
  });

  const httpInterval = minIntervalForMonitor(ctx.plan.id, "HTTP");
  const browserInterval = minIntervalForMonitor(ctx.plan.id, "BROWSER_DESKTOP");

  const httpId = newId();
  await db.insert(monitors).values({
    id: httpId,
    organizationId: ctx.organizationId,
    siteId,
    type: "HTTP",
    name: "HTTP",
    enabled: true,
    intervalSeconds: httpInterval,
    nextRunAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const browserEnabled = canUseBrowserMonitoring(ctx.plan.id);
  for (const viewport of ["desktop", "mobile"] as const) {
    await db.insert(monitors).values({
      id: newId(),
      organizationId: ctx.organizationId,
      siteId,
      type: viewport === "desktop" ? "BROWSER_DESKTOP" : "BROWSER_MOBILE",
      name: viewport === "desktop" ? "Browser desktop" : "Browser mobile",
      enabled: browserEnabled,
      intervalSeconds: browserInterval,
      nextRunAt: now,
      viewport,
      createdAt: now,
      updatedAt: now,
    });
  }

  await enqueueJob({
    type: "HTTP_CHECK",
    organizationId: ctx.organizationId,
    siteId,
    monitorId: httpId,
    payload: { trigger: "onboarding" },
  });
  if (browserEnabled) {
    const browserMonitors = await db
      .select()
      .from(monitors)
      .where(and(eq(monitors.siteId, siteId), eq(monitors.organizationId, ctx.organizationId)));
    for (const monitor of browserMonitors.filter((item) => item.type.startsWith("BROWSER"))) {
      await enqueueJob({
        type: "BROWSER_CHECK",
        organizationId: ctx.organizationId,
        siteId,
        monitorId: monitor.id,
        payload: { trigger: "onboarding" },
      });
    }
  }

  await writeAudit({
    action: "site.created",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetType: "site",
    targetId: siteId,
  });

  return siteId;
}

export async function queueManualCheck(ctx: OrgContext, siteId: string) {
  await enforceRateLimit({
    key: `manual-check:${ctx.organizationId}:${siteId}`,
    limit: 4,
    windowSeconds: MANUAL_CHECK_COOLDOWN_SECONDS * 4,
  });
  const siteMonitors = await db
    .select()
    .from(monitors)
    .where(
      and(
        eq(monitors.siteId, siteId),
        eq(monitors.organizationId, ctx.organizationId),
        eq(monitors.enabled, true),
      ),
    );
  const jobIds: string[] = [];
  const browserEnabled = canUseBrowserMonitoring(ctx.plan.id);
  for (const monitor of siteMonitors) {
    if (monitor.type !== "HTTP" && !browserEnabled) continue;
    if (await hasActiveJob(monitor.id)) continue;
    const id = await enqueueJob({
      type: monitor.type === "HTTP" ? "HTTP_CHECK" : "BROWSER_CHECK",
      organizationId: ctx.organizationId,
      siteId,
      monitorId: monitor.id,
      payload: { trigger: "manual" },
    });
    jobIds.push(id);
  }
  if (!jobIds.length && siteMonitors.length) {
    const active = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        and(
          eq(jobs.organizationId, ctx.organizationId),
          inArray(
            jobs.monitorId,
            siteMonitors.map((monitor) => monitor.id),
          ),
          inArray(jobs.status, ["pending", "running"]),
        ),
      );
    for (const row of active) jobIds.push(row.id);
  }
  return jobIds;
}

export async function pauseSite(ctx: OrgContext, siteId: string, paused: boolean) {
  await db
    .update(sites)
    .set({
      pausedAt: paused ? new Date() : null,
      status: paused ? "PAUSED" : "UNKNOWN",
      updatedAt: new Date(),
    })
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, ctx.organizationId)));
  await writeAudit({
    action: paused ? "monitor.paused" : "monitor.resumed",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetType: "site",
    targetId: siteId,
  });
}

export async function deleteSite(ctx: OrgContext, siteId: string) {
  await db
    .delete(sites)
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, ctx.organizationId)));
  await writeAudit({
    action: "site.deleted",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetType: "site",
    targetId: siteId,
  });
}

export async function getSiteForOrg(organizationId: string, siteId: string) {
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)))
    .limit(1);
  return site ?? null;
}
