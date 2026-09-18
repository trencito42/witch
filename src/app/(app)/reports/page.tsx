import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";

export default async function ReportsPage() {
  const ctx = await requireOrgContext();
  if (!ctx.plan.reports) {
    return (
      <div>
        <PageHeader title="Reports" description="Reports are available on Freelancer and above." />
      </div>
    );
  }
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.organizationId, ctx.organizationId))
    .orderBy(desc(reports.createdAt))
    .limit(50);
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Monthly summaries of uptime, incidents, and response time."
      />
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          Your first report will appear after enough monitoring data is collected.
        </p>
      ) : (
        <ul className="text-[13px] divide-y divide-[var(--border)]">
          {rows.map((report) => (
            <li key={report.id} className="py-3">
              <Link href={`/reports/${report.id}`}>{report.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
