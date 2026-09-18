import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  monitorChecks,
  monitors,
  sites,
  visualDiffs,
  visualSnapshots,
  type Monitor,
  type Site,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { childLogger } from "@/lib/logger";
import { getStorage, snapshotKey } from "@/storage";
import { runHttpCheck } from "@/monitoring/http";
import { runBrowserCheck } from "@/monitoring/browser";
import { compareScreenshots, imageMeta, toWebp } from "@/monitoring/visual";
import { diffDomSignals, type DomSignals } from "@/monitoring/dom";
import { classifyBrowser, classifyHttp } from "@/monitoring/classify";
import { applyIssues } from "@/features/incidents/service";
import { enqueueJob } from "@/server/jobs";
import type { VisualSensitivity } from "@/lib/constants";
import { canUseBrowserMonitoring, canUseVisualMonitoring } from "@/lib/plans";
import { getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";

function jitter(intervalSeconds: number) {
  const spread = Math.min(30, Math.round(intervalSeconds * 0.08));
  return Math.round((Math.random() * 2 - 1) * spread);
}

export async function scheduleNext(monitor: Monitor) {
  const next = new Date(Date.now() + (monitor.intervalSeconds + jitter(monitor.intervalSeconds)) * 1000);
  await db
    .update(monitors)
    .set({ nextRunAt: next, lastRunAt: new Date(), updatedAt: new Date(), lockedAt: null })
    .where(eq(monitors.id, monitor.id));
}

async function planForOrg(organizationId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  return getPlanLimits(sub?.planId ?? "free");
}

export async function processHttpMonitor(monitor: Monitor, site: Site, trigger: string) {
  const log = childLogger({ monitorId: monitor.id, siteId: site.id, organizationId: site.organizationId });
  const result = await runHttpCheck(site.url);
  const checkId = newId();
  await db.insert(monitorChecks).values({
    id: checkId,
    organizationId: site.organizationId,
    siteId: site.id,
    monitorId: monitor.id,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    durationMs: result.durationMs,
    success: result.success,
    statusCode: result.statusCode,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    resolvedIp: result.resolvedIp,
    finalUrl: result.finalUrl,
    sslValid: result.sslValid,
    sslExpiresAt: result.sslExpiresAt,
    trigger,
    summary: {
      redirectChain: result.redirectChain,
      headers: result.headers,
    },
    createdAt: new Date(),
  });

  const env = getEnv();
  const failures = result.success ? 0 : monitor.consecutiveFailures + 1;
  const successes = result.success ? monitor.consecutiveSuccesses + 1 : 0;
  await db
    .update(monitors)
    .set({
      consecutiveFailures: failures,
      consecutiveSuccesses: successes,
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, monitor.id));
  await db
    .update(sites)
    .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
    .where(eq(sites.id, site.id));

  const issues = classifyHttp({
    success: result.success,
    statusCode: result.statusCode,
    errorCode: result.errorCode,
    durationMs: result.durationMs,
    sslValid: result.sslValid,
    redirectCount: result.redirectChain.length,
  });
  const confirmUptime = failures >= env.HTTP_CONFIRMATION_FAILURES;
  if (!result.success && failures === 1) {
    await enqueueJob({
      type: "CONFIRM_CHECK",
      organizationId: site.organizationId,
      siteId: site.id,
      monitorId: monitor.id,
      runAt: new Date(Date.now() + env.CHECK_CONFIRMATION_DELAY_SECONDS * 1000),
      payload: { reason: "http-confirm" },
      maxAttempts: 2,
    });
  }
  await applyIssues({
    organizationId: site.organizationId,
    siteId: site.id,
    monitorId: monitor.id,
    issues,
    confirmUptime,
  });
  log.info({ success: result.success, statusCode: result.statusCode }, "http check complete");
}

export async function processBrowserMonitor(monitor: Monitor, site: Site, trigger: string) {
  const plan = await planForOrg(site.organizationId);
  if (!canUseBrowserMonitoring(plan.id) && trigger !== "onboarding") {
    return;
  }
  const viewport = (monitor.viewport as "desktop" | "mobile") ?? "desktop";
  const result = await runBrowserCheck({
    url: site.url,
    viewport,
    selector: monitor.selector,
    expectedText: monitor.expectedText,
  });
  const checkId = newId();
  await db.insert(monitorChecks).values({
    id: checkId,
    organizationId: site.organizationId,
    siteId: site.id,
    monitorId: monitor.id,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    durationMs: result.durationMs,
    success: result.success,
    statusCode: result.statusCode,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    finalUrl: result.finalUrl,
    pageTitle: result.pageTitle,
    trigger,
    summary: {
      consoleErrors: result.consoleErrors,
      failedRequests: result.failedRequests,
      navigationTiming: result.navigationTiming,
      elementFound: result.elementFound,
    },
    createdAt: new Date(),
  });
  await db
    .update(sites)
    .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
    .where(eq(sites.id, site.id));

  let visualChanged = false;
  let differenceRatio: number | undefined;
  let domSignificant = false;
  let missingButtons: string[] = [];
  let snapshotId: string | null = null;

  if (result.screenshot) {
    const webp = await toWebp(result.screenshot);
    const meta = await imageMeta(result.screenshot);
    snapshotId = newId();
    const key = snapshotKey({
      organizationId: site.organizationId,
      siteId: site.id,
      snapshotId,
      kind: viewport,
    });
    await getStorage().put(key, webp, "image/webp");
    const [baseline] = await db
      .select()
      .from(visualSnapshots)
      .where(
        and(
          eq(visualSnapshots.monitorId, monitor.id),
          eq(visualSnapshots.isBaseline, true),
        ),
      )
      .limit(1);
    const isBaseline = !baseline;
    await db.insert(visualSnapshots).values({
      id: snapshotId,
      organizationId: site.organizationId,
      siteId: site.id,
      monitorId: monitor.id,
      checkId,
      viewport,
      storageKey: key,
      contentType: "image/webp",
      byteSize: webp.byteLength,
      width: meta.width,
      height: meta.height,
      isBaseline,
      domSignals: result.dom,
      createdAt: new Date(),
    });

    if (baseline && canUseVisualMonitoring(plan.id)) {
      const baselineBytes = await getStorage().get(baseline.storageKey);
      if (baselineBytes) {
        const diff = await compareScreenshots(
          baselineBytes,
          webp,
          (site.visualSensitivity as VisualSensitivity) ?? "MEDIUM",
        );
        const diffId = newId();
        let diffKey: string | null = null;
        if (diff.aboveThreshold) {
          diffKey = snapshotKey({
            organizationId: site.organizationId,
            siteId: site.id,
            snapshotId: diffId,
            kind: "diff",
          });
          const diffWebp = await toWebp(diff.diffPng);
          await getStorage().put(diffKey, diffWebp, "image/webp");
        }
        await db.insert(visualDiffs).values({
          id: diffId,
          organizationId: site.organizationId,
          siteId: site.id,
          monitorId: monitor.id,
          baselineSnapshotId: baseline.id,
          currentSnapshotId: snapshotId,
          diffStorageKey: diffKey,
          differenceRatio: diff.differenceRatio.toFixed(6),
          changedPixels: diff.changedPixels,
          width: diff.width,
          height: diff.height,
          aboveThreshold: diff.aboveThreshold,
          createdAt: new Date(),
        });
        visualChanged = diff.aboveThreshold;
        differenceRatio = diff.differenceRatio;
      }
      if (baseline.domSignals && result.dom) {
        const domDiff = diffDomSignals(baseline.domSignals as DomSignals, result.dom);
        domSignificant = domDiff.significant;
        missingButtons = domDiff.missingButtons;
      }
    }
  }

  const issues = classifyBrowser({
    consoleErrors: result.consoleErrors,
    failedRequests: result.failedRequests.map((item) => ({
      url: item.url,
      status: item.status,
    })),
    visualChanged,
    differenceRatio,
    missingSelector:
      monitor.type === "ELEMENT" && result.elementFound === false
        ? monitor.selector ?? "text"
        : null,
    missingText:
      monitor.type === "ELEMENT" && result.elementFound === false
        ? monitor.expectedText
        : null,
    domSignificant,
    domMissingButtons: missingButtons,
  });

  await applyIssues({
    organizationId: site.organizationId,
    siteId: site.id,
    monitorId: monitor.id,
    issues,
    confirmUptime: true,
  });
}

export async function processMonitor(monitorId: string, trigger = "schedule") {
  const [monitor] = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
  if (!monitor || !monitor.enabled) return;
  const [site] = await db.select().from(sites).where(eq(sites.id, monitor.siteId)).limit(1);
  if (!site || site.pausedAt) return;
  try {
    if (monitor.type === "HTTP") await processHttpMonitor(monitor, site, trigger);
    else await processBrowserMonitor(monitor, site, trigger);
  } finally {
    await scheduleNext(monitor);
  }
}
