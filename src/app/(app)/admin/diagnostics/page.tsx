import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsages, alertDeliveries, jobs, systemHeartbeats } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { storageUsageBytes } from "@/storage";

export default async function AdminPage() {
  const ctx = await requireOrgContext();
  if (!ctx.isAdmin) notFound();
  const heartbeats = await db.select().from(systemHeartbeats);
  const queue = await db
    .select({ status: jobs.status, count: sql<number>`count(*)` })
    .from(jobs)
    .groupBy(jobs.status);
  const [ai] = await db.select({ count: sql<number>`count(*)` }).from(aiUsages);
  const [emailFails] = await db
    .select({ count: sql<number>`count(*)` })
    .from(alertDeliveries)
    .where(eq(alertDeliveries.status, "failed"));
  const storage = await storageUsageBytes();

  return (
    <div className="max-w-xl text-[13px] space-y-4">
      <PageHeader title="Diagnostics" />
      <pre className="text-[12px] text-[var(--text-muted)] whitespace-pre-wrap">
        {JSON.stringify({ heartbeats, queue, aiCalls: Number(ai?.count ?? 0), emailFailures: Number(emailFails?.count ?? 0), storageBytes: storage }, null, 2)}
      </pre>
    </div>
  );
}
