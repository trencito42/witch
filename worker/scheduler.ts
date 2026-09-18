import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobs, monitors, sites, systemHeartbeats } from "@/db/schema";
import { enqueueJob, hasActiveJob } from "@/server/jobs";
import { logger } from "@/lib/logger";
import { getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";

async function heartbeat() {
  await db
    .insert(systemHeartbeats)
    .values({ name: "scheduler", lastSeenAt: new Date(), metadata: {} })
    .onDuplicateKeyUpdate({ set: { lastSeenAt: new Date() } });
}

function jitterMs(intervalSeconds: number, priority: boolean) {
  const spread = priority ? 5_000 : Math.min(45_000, intervalSeconds * 80);
  return Math.round(Math.random() * spread);
}

export async function tickScheduler() {
  const now = new Date();
  const due = await db
    .select({ monitor: monitors, site: sites })
    .from(monitors)
    .innerJoin(sites, eq(sites.id, monitors.siteId))
    .where(
      and(
        eq(monitors.enabled, true),
        lte(monitors.nextRunAt, now),
      ),
    )
    .limit(200);

  for (const row of due) {
    if (row.site.pausedAt) continue;
    if (await hasActiveJob(row.monitor.id)) continue;
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, row.monitor.organizationId))
      .limit(1);
    const plan = getPlanLimits(sub?.planId ?? "free");
    if (row.monitor.type !== "HTTP" && !plan.browserMonitoring) continue;
    const type = row.monitor.type === "HTTP" ? "HTTP_CHECK" : "BROWSER_CHECK";
    await enqueueJob({
      type,
      organizationId: row.monitor.organizationId,
      siteId: row.monitor.siteId,
      monitorId: row.monitor.id,
      payload: { trigger: "schedule" },
      runAt: new Date(Date.now() + jitterMs(row.monitor.intervalSeconds, plan.priorityChecks)),
    });
    await db
      .update(monitors)
      .set({
        nextRunAt: new Date(Date.now() + row.monitor.intervalSeconds * 1000),
        updatedAt: new Date(),
      })
      .where(eq(monitors.id, row.monitor.id));
  }

  const hour = now.getUTCHours();
  const day = now.getUTCDate();
  if (day === 1 && hour === 6) {
    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.type, "MONTHLY_REPORT"), eq(jobs.status, "pending")))
      .limit(1);
    if (!existing) {
      await enqueueJob({ type: "MONTHLY_REPORT", payload: {} });
    }
  }
  if (hour === 3) {
    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.type, "SCREENSHOT_CLEANUP"), eq(jobs.status, "pending")))
      .limit(1);
    if (!existing) {
      await enqueueJob({ type: "SCREENSHOT_CLEANUP", payload: {} });
    }
  }
}

export async function runSchedulerLoop() {
  let running = true;
  process.on("SIGTERM", () => {
    running = false;
  });
  process.on("SIGINT", () => {
    running = false;
  });
  logger.info("scheduler started");
  while (running) {
    try {
      await heartbeat();
      await tickScheduler();
    } catch (error) {
      logger.error({ err: error }, "scheduler tick failed");
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  logger.info("scheduler stopped");
}

const startedDirectly = process.argv[1]?.includes("worker/scheduler");
if (startedDirectly) {
  void runSchedulerLoop();
}

void sql;
