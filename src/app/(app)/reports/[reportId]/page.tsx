import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reportItems, reports, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const ctx = await requireOrgContext();
  const { reportId } = await params;
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.organizationId, ctx.organizationId)))
    .limit(1);
  if (!report) notFound();
  const items = await db.select().from(reportItems).where(eq(reportItems.reportId, report.id));
  const [site] = report.siteId
    ? await db.select().from(sites).where(eq(sites.id, report.siteId)).limit(1)
    : [];

  return (
    <article className="max-w-xl print:max-w-none">
      <p className="text-[12px] tracking-[0.18em] uppercase text-[var(--text-muted)] mb-3">Witch report</p>
      <h1 className="text-2xl mb-2">{report.title}</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">{site?.name}</p>
      <dl className="space-y-3 text-[14px]">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-[var(--border)] py-2">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
