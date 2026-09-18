import { and, eq, inArray, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { jobs, monitorChecks, systemHeartbeats, visualDiffs, visualSnapshots } from "@/db/schema";
import { claimNextJob, completeJob, failJob, recoverStaleJobs } from "@/server/jobs";
import { processMonitor } from "@/features/monitors/runner";
import { processAiAnalysis, processEmailAlert } from "@/features/alerts/service";
import { generateMonthlyReports, sendReportEmail } from "@/features/reports/service";
import { getStorage } from "@/storage";
import { childLogger, logger } from "@/lib/logger";
import { closeBrowser } from "@/monitoring/browser";
import { getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { sites } from "@/db/schema";
import { getEnv } from "@/lib/env";

async function heartbeat(name: string, metadata?: Record<string, unknown>) {
  await db
    .insert(systemHeartbeats)
    .values({ name, lastSeenAt: new Date(), metadata: metadata ?? {} })
    .onDuplicateKeyUpdate({
      set: { lastSeenAt: new Date(), metadata: metadata ?? {} },
    });
}

async function handleJob(job: typeof jobs.$inferSelect) {
  const log = childLogger({
    jobId: job.id,
    type: job.type,
    monitorId: job.monitorId ?? undefined,
    siteId: job.siteId ?? undefined,
    organizationId: job.organizationId ?? undefined,
  });
  log.info("job started");
  const payload = (job.payload ?? {}) as Record<string, unknown>;
  switch (job.type) {
    case "HTTP_CHECK":
    case "BROWSER_CHECK":
    case "CONFIRM_CHECK":
      if (!job.monitorId) throw new Error("monitorId required");
      await processMonitor(job.monitorId, String(payload.trigger ?? job.type.toLowerCase()));
      break;
    case "AI_ANALYSIS":
      if (!job.incidentId || !job.organizationId) throw new Error("incident required");
      await processAiAnalysis(job.incidentId, job.organizationId);
      break;
    case "EMAIL_ALERT":
      if (payload.kind === "monthly-report") {
        await sendReportEmail(String(payload.to), String(payload.title), String(payload.reportId));
        break;
      }
      if (!job.incidentId || !job.organizationId) throw new Error("incident required");
      await processEmailAlert(job.incidentId, job.organizationId, String(payload.kind ?? "detected"));
      break;
    case "MONTHLY_REPORT":
      await generateMonthlyReports();
      break;
    case "SCREENSHOT_CLEANUP":
      await cleanupRetention();
      break;
    default:
      throw new Error(`Unknown job type ${job.type}`);
  }
}

async function cleanupRetention() {
  const allSites = await db.select().from(sites);
  for (const site of allSites) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, site.organizationId))
      .limit(1);
    const days = getPlanLimits(sub?.planId ?? "free").historyDays;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snapshots = await db
      .select()
      .from(visualSnapshots)
      .where(
        and(
          eq(visualSnapshots.siteId, site.id),
          eq(visualSnapshots.isBaseline, false),
          lte(visualSnapshots.createdAt, cutoff),
        ),
      );
    const snapshotIds = snapshots.map((row) => row.id);
    const diffAge = lte(visualDiffs.createdAt, cutoff);
    const diffs = await db
      .select()
      .from(visualDiffs)
      .where(
        and(
          eq(visualDiffs.siteId, site.id),
          snapshotIds.length
            ? or(
                diffAge,
                inArray(visualDiffs.currentSnapshotId, snapshotIds),
                inArray(visualDiffs.baselineSnapshotId, snapshotIds),
              )
            : diffAge,
        ),
      );
    const storage = getStorage();
    for (const diff of diffs) {
      if (diff.diffStorageKey) await storage.delete(diff.diffStorageKey);
      await db.delete(visualDiffs).where(eq(visualDiffs.id, diff.id));
    }
    for (const snapshot of snapshots) {
      await storage.delete(snapshot.storageKey);
      await db.delete(visualSnapshots).where(eq(visualSnapshots.id, snapshot.id));
    }
    await db
      .delete(monitorChecks)
      .where(and(eq(monitorChecks.siteId, site.id), lte(monitorChecks.createdAt, cutoff)));
  }
}

export async function runWorkerLoop() {
  let running = true;
  const shutdown = () => {
    running = false;
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  logger.info("worker started");
  const env = getEnv();
  const concurrency = Math.max(1, Math.min(8, env.WORKER_CONCURRENCY));
  const browserLimit = Math.max(1, Math.min(concurrency, env.BROWSER_CONCURRENCY));
  const inflight = new Set<Promise<void>>();
  let browserInflight = 0;

  const runOne = async (job: typeof jobs.$inferSelect) => {
    const isBrowser = job.type === "BROWSER_CHECK";
    if (isBrowser) browserInflight += 1;
    try {
      await handleJob(job);
      await completeJob(job.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("job failed");
      logger.error({ err, jobId: job.id }, "job failed");
      const retryable = !/invalid|unsafe url|not configured/i.test(err.message);
      await failJob(job, err, retryable ? undefined : 86_400);
      if (!retryable) {
        await db.update(jobs).set({ status: "failed", completedAt: new Date() }).where(eq(jobs.id, job.id));
      }
    } finally {
      if (isBrowser) browserInflight -= 1;
    }
  };

  while (running) {
    try {
      await heartbeat("worker", { inflight: inflight.size, browserInflight });
      await recoverStaleJobs();
      while (running && inflight.size < concurrency) {
        const excludeBrowser = browserInflight >= browserLimit ? (["BROWSER_CHECK"] as const) : undefined;
        const job = await claimNextJob(undefined, excludeBrowser ? { excludeTypes: [...excludeBrowser] } : undefined);
        if (!job) break;
        const task = runOne(job).finally(() => inflight.delete(task));
        inflight.add(task);
      }
      if (inflight.size === 0) {
        await sleep(1500);
      } else {
        await Promise.race([...inflight, sleep(500)]);
      }
    } catch (error) {
      logger.error({ err: error }, "worker loop error");
      await sleep(3000);
    }
  }
  await Promise.allSettled([...inflight]);
  await closeBrowser();
  logger.info("worker stopped");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const startedDirectly = process.argv[1]?.includes("worker/index");
if (startedDirectly) {
  void runWorkerLoop();
}
