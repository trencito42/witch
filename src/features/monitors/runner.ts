import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  monitorChecks,
  monitors,
  sites,
  visualDiffs,
  visualSnapshots,
  type Monitor,
  type Site,
  type VisualNoiseSettings,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { childLogger } from "@/lib/logger";
import { getStorage, snapshotKey } from "@/storage";
import { runHttpCheck } from "@/monitoring/http";
import { runBrowserCheck } from "@/monitoring/browser";
import { compareScreenshots, imageMeta, toWebp } from "@/monitoring/visual";
import { diffDomSignals, type DomSignals } from "@/monitoring/dom";
import { classifyBrowser, classifyHttp, shouldRecoverAfterSuccesses } from "@/monitoring/classify";
import { meaningfulFailedResources } from "@/monitoring/assets";
import { applyIssues } from "@/features/incidents/service";
import { enqueueJob } from "@/server/jobs";
import type { VisualSensitivity } from "@/lib/constants";
import { canUseBrowserMonitoring, canUseVisualMonitoring, getEffectivePlan } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { hostnameFromUrl, sanitizeEvidence } from "@/lib/safe-url";

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
  return getEffectivePlan(sub);
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
    consecutiveSuccesses: successes,
    recoverAfterSuccesses: env.HTTP_RECOVERY_SUCCESSES,
  });
  log.info({ success: result.success, statusCode: result.statusCode }, "http check complete");
}

export async function processBrowserMonitor(monitor: Monitor, site: Site, trigger: string) {
  const plan = await planForOrg(site.organizationId);
  if (!canUseBrowserMonitoring(plan.id)) {
    return;
  }
  const viewport = (monitor.viewport as "desktop" | "mobile") ?? "desktop";
  const ignoreSelectors = Array.isArray(site.ignoreSelectors) ? (site.ignoreSelectors as string[]) : [];
  const noiseSettings = (site.visualNoiseSettings as VisualNoiseSettings) ?? undefined;
  const result = await runBrowserCheck({
    url: site.url,
    viewport,
    selector: monitor.selector,
    expectedText: monitor.expectedText,
    ignoreSelectors,
    colorScheme: noiseSettings?.colorScheme,
    visualNoiseSettings: noiseSettings,
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
      consoleErrors: result.consoleErrors.map(sanitizeEvidence),
      failedRequests: result.failedRequests,
      navigationTiming: result.navigationTiming,
      elementFound: result.elementFound,
      pageStabilized: result.pageStabilized,
      stabilization: result.stabilization,
    },
    createdAt: new Date(),
  });
  await db
    .update(sites)
    .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
    .where(eq(sites.id, site.id));

  const checkOk = result.success && Boolean(result.screenshot);
  const failures = checkOk ? 0 : monitor.consecutiveFailures + 1;
  const successes = checkOk ? monitor.consecutiveSuccesses + 1 : 0;
  await db
    .update(monitors)
    .set({
      consecutiveFailures: failures,
      consecutiveSuccesses: successes,
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, monitor.id));

  let visualChanged = false;
  let visualDiffId: string | null = null;
  let differenceRatio: number | undefined;
  let filteredDifferenceRatio: number | undefined;
  let boundingBox: { x: number; y: number; width: number; height: number } | null = null;
  let domSignificant = false;
  let missingButtons: string[] = [];
  let snapshotId: string | null = null;
  let horizontalOverflow = false;
  let looksLikeErrorPage = false;
  let brokenImages: string[] = [];
  let emptyBody = false;
  let formsMissingSubmit = 0;

  const screenshotUsable = Boolean(result.screenshot) && result.errorCode !== "SCREENSHOT_LIMIT";

  if (screenshotUsable && result.screenshot) {
    const webp = await toWebp(result.screenshot);
    const meta = await imageMeta(webp);
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
          eq(visualSnapshots.viewport, viewport),
        ),
      )
      .orderBy(desc(visualSnapshots.createdAt))
      .limit(1);
    const isBaseline = !baseline && result.success;
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
          result.ignoreRegions,
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
          differenceRatio: diff.filteredDifferenceRatio.toFixed(6),
          changedPixels: diff.filteredChangedPixels,
          width: diff.width,
          height: diff.height,
          aboveThreshold: diff.aboveThreshold,
          metadata: {
            rawDifferenceRatio: diff.differenceRatio,
            filteredDifferenceRatio: diff.filteredDifferenceRatio,
            boundingBox: diff.boundingBox,
            boundingBoxes: diff.boundingBoxes,
            localized: diff.localized,
            pageStabilized: result.pageStabilized,
          },
          createdAt: new Date(),
        });
        visualChanged = diff.aboveThreshold;
        if (diff.aboveThreshold) visualDiffId = diffId;
        differenceRatio = diff.differenceRatio;
        filteredDifferenceRatio = diff.filteredDifferenceRatio;
        boundingBox = diff.boundingBox;
      }
      if (baseline.domSignals && result.dom) {
        const domDiff = diffDomSignals(baseline.domSignals as DomSignals, result.dom);
        domSignificant = domDiff.significant;
        missingButtons = domDiff.missingButtons;
        horizontalOverflow = domDiff.horizontalOverflow;
        looksLikeErrorPage = domDiff.looksLikeErrorPage;
        brokenImages = domDiff.brokenImages;
        emptyBody = domDiff.emptyBody;
        formsMissingSubmit = domDiff.formsMissingSubmit;
      }
    }
  } else if (result.dom?.looksLikeErrorPage || result.dom?.horizontalOverflow || (result.dom?.brokenImages.length ?? 0) > 0) {
    looksLikeErrorPage = Boolean(result.dom?.looksLikeErrorPage);
    horizontalOverflow = Boolean(result.dom?.horizontalOverflow);
    brokenImages = result.dom?.brokenImages ?? [];
    emptyBody = (result.dom?.bodyTextLength ?? 0) < 40;
    formsMissingSubmit = result.dom?.formsMissingSubmit ?? 0;
    domSignificant = true;
  }

  const pageHost = (() => {
    try {
      return hostnameFromUrl(site.url);
    } catch {
      return "";
    }
  })();
  const classifiedAssets = meaningfulFailedResources(result.failedRequests, pageHost);

  const issues = classifyBrowser({
    success: result.success,
    errorCode: result.errorCode,
    statusCode: result.statusCode,
    consoleErrors: result.consoleErrors.map(sanitizeEvidence),
    failedRequests: classifiedAssets.map((item) => ({
      url: item.url,
      status: item.status,
      kind: item.kind,
      visibleImpact: item.visibleImpact,
    })),
    visualChanged,
    differenceRatio,
    filteredDifferenceRatio,
    boundingBox,
    visualDiffId,
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
    horizontalOverflow,
    looksLikeErrorPage,
    brokenImages,
    emptyBody,
    formsMissingSubmit,
  });

  const env = getEnv();
  const connectivityFailure = !result.success && result.errorCode !== "SCREENSHOT_LIMIT";
  if (connectivityFailure && failures === 1) {
    await enqueueJob({
      type: "BROWSER_CHECK",
      organizationId: site.organizationId,
      siteId: site.id,
      monitorId: monitor.id,
      runAt: new Date(Date.now() + env.CHECK_CONFIRMATION_DELAY_SECONDS * 1000),
      payload: { trigger: "confirm", reason: "browser-confirm" },
      maxAttempts: 2,
    });
  }
  await applyIssues({
    organizationId: site.organizationId,
    siteId: site.id,
    monitorId: monitor.id,
    issues,
    confirmUptime: connectivityFailure ? failures >= env.HTTP_CONFIRMATION_FAILURES : true,
    consecutiveSuccesses: successes,
    recoverAfterSuccesses: env.HTTP_RECOVERY_SUCCESSES,
  });
}

export async function processMonitor(monitorId: string, trigger = "schedule") {
  const [monitor] = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
  if (!monitor || !monitor.enabled) return;
  const [site] = await db.select().from(sites).where(eq(sites.id, monitor.siteId)).limit(1);
  if (!site || site.pausedAt) {
    if (monitor) {
      await db
        .update(monitors)
        .set({
          nextRunAt: new Date(Date.now() + monitor.intervalSeconds * 1000),
          updatedAt: new Date(),
        })
        .where(eq(monitors.id, monitor.id));
    }
    return;
  }
  try {
    if (monitor.type === "HTTP") await processHttpMonitor(monitor, site, trigger);
    else await processBrowserMonitor(monitor, site, trigger);
  } finally {
    await scheduleNext(monitor);
  }
}

export { shouldRecoverAfterSuccesses };
