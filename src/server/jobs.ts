import "server-only";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobs, type Job } from "@/db/schema";
import { newId } from "@/lib/ids";
import { JOB_STALE_MS } from "@/lib/constants";
import os from "node:os";

export type JobType =
  | "HTTP_CHECK"
  | "BROWSER_CHECK"
  | "AI_ANALYSIS"
  | "EMAIL_ALERT"
  | "MONTHLY_REPORT"
  | "SCREENSHOT_CLEANUP"
  | "CONFIRM_CHECK";

export type JobPayload = Record<string, unknown>;

export async function enqueueJob(input: {
  type: JobType;
  organizationId?: string | null;
  siteId?: string | null;
  monitorId?: string | null;
  incidentId?: string | null;
  payload?: JobPayload;
  runAt?: Date;
  maxAttempts?: number;
}) {
  const id = newId("job");
  await db.insert(jobs).values({
    id,
    type: input.type,
    status: "pending",
    organizationId: input.organizationId ?? null,
    siteId: input.siteId ?? null,
    monitorId: input.monitorId ?? null,
    incidentId: input.incidentId ?? null,
    payload: input.payload ?? {},
    runAt: input.runAt ?? new Date(),
    maxAttempts: input.maxAttempts ?? 5,
    createdAt: new Date(),
  });
  return id;
}

export async function hasActiveJob(monitorId: string) {
  const rows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.monitorId, monitorId),
        inArray(jobs.status, ["pending", "running"]),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function claimNextJob(workerId = `${os.hostname()}:${process.pid}`): Promise<Job | null> {
  const now = new Date();
  const [claimed] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "pending"), lte(jobs.runAt, now)))
    .orderBy(jobs.runAt)
    .limit(1);

  if (!claimed) return null;

  const result = await db
    .update(jobs)
    .set({
      status: "running",
      claimedAt: now,
      claimedBy: workerId,
      attempts: claimed.attempts + 1,
    })
    .where(and(eq(jobs.id, claimed.id), eq(jobs.status, "pending")));

  if (result[0].affectedRows === 0) return null;

  const [fresh] = await db.select().from(jobs).where(eq(jobs.id, claimed.id)).limit(1);
  return fresh ?? null;
}

export async function completeJob(jobId: string) {
  await db
    .update(jobs)
    .set({ status: "completed", completedAt: new Date(), lastError: null })
    .where(eq(jobs.id, jobId));
}

export async function failJob(job: Job, error: Error, retryDelaySeconds?: number) {
  const retryable = job.attempts < job.maxAttempts;
  const delay = retryDelaySeconds ?? Math.min(60 * 2 ** Math.max(job.attempts - 1, 0), 30 * 60);
  await db
    .update(jobs)
    .set({
      status: retryable ? "pending" : "failed",
      lastError: error.message.slice(0, 2000),
      runAt: retryable ? new Date(Date.now() + delay * 1000) : job.runAt,
      claimedAt: null,
      claimedBy: null,
      completedAt: retryable ? null : new Date(),
    })
    .where(eq(jobs.id, job.id));
}

export async function cancelJob(jobId: string) {
  await db.update(jobs).set({ status: "cancelled" }).where(eq(jobs.id, jobId));
}

export async function recoverStaleJobs() {
  const cutoff = new Date(Date.now() - JOB_STALE_MS);
  await db
    .update(jobs)
    .set({
      status: "pending",
      claimedAt: null,
      claimedBy: null,
    })
    .where(and(eq(jobs.status, "running"), lte(jobs.claimedAt, cutoff)));
}

export async function queueDepth() {
  const rows = await db
    .select({
      status: jobs.status,
      count: sql<number>`count(*)`,
    })
    .from(jobs)
    .groupBy(jobs.status);
  return rows;
}
