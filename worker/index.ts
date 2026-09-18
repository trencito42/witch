import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { jobs, systemHeartbeats, visualSnapshots } from "@/db/schema";
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
    for (const snapshot of snapshots) {
      await getStorage().delete(snapshot.storageKey);
      await db.delete(visualSnapshots).where(eq(visualSnapshots.id, snapshot.id));
    }
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
  while (running) {
    try {
      await heartbeat("worker");
      await recoverStaleJobs();
      const job = await claimNextJob();
      if (!job) {
        await sleep(1500);
        continue;
      }
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
      }
    } catch (error) {
      logger.error({ err: error }, "worker loop error");
      await sleep(3000);
    }
  }
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
