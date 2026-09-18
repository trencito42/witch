import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { monitors, sites, systemHeartbeats } from "@/db/schema";
import { enqueueJob, hasActiveJob, hasJobCreatedSince } from "@/server/jobs";
import { logger } from "@/lib/logger";
import { getPlanLimits } from "@/lib/plans";
import { subscriptions } from "@/db/schema";
import { utcHourStart } from "@/lib/schedule";

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
    if (row.site.pausedAt) {
      await db
        .update(monitors)
        .set({
          nextRunAt: new Date(Date.now() + row.monitor.intervalSeconds * 1000),
          updatedAt: new Date(),
        })
        .where(eq(monitors.id, row.monitor.id));
      continue;
    }
    if (await hasActiveJob(row.monitor.id)) continue;
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, row.monitor.organizationId))
      .limit(1);
    const plan = getPlanLimits(sub?.planId ?? "free");
    if (row.monitor.type !== "HTTP" && !plan.browserMonitoring) {
      await db
        .update(monitors)
        .set({
          nextRunAt: new Date(Date.now() + row.monitor.intervalSeconds * 1000),
          updatedAt: new Date(),
        })
        .where(eq(monitors.id, row.monitor.id));
      continue;
    }
    const claimed = await db
      .update(monitors)
      .set({
        nextRunAt: new Date(Date.now() + row.monitor.intervalSeconds * 1000),
        updatedAt: new Date(),
      })
      .where(and(eq(monitors.id, row.monitor.id), lte(monitors.nextRunAt, now)));
    if (claimed[0].affectedRows === 0) continue;
    const type = row.monitor.type === "HTTP" ? "HTTP_CHECK" : "BROWSER_CHECK";
    await enqueueJob({
      type,
      organizationId: row.monitor.organizationId,
      siteId: row.monitor.siteId,
      monitorId: row.monitor.id,
      payload: { trigger: "schedule" },
      runAt: new Date(Date.now() + jitterMs(row.monitor.intervalSeconds, plan.priorityChecks)),
    });
  }

  const hour = now.getUTCHours();
  const day = now.getUTCDate();
  const hourStart = utcHourStart(now);
  if (day === 1 && hour === 6) {
    if (!(await hasJobCreatedSince("MONTHLY_REPORT", hourStart))) {
      await enqueueJob({ type: "MONTHLY_REPORT", payload: { period: hourStart.toISOString() } });
    }
  }
  if (hour === 3) {
    if (!(await hasJobCreatedSince("SCREENSHOT_CLEANUP", hourStart))) {
      await enqueueJob({ type: "SCREENSHOT_CLEANUP", payload: { period: hourStart.toISOString() } });
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
