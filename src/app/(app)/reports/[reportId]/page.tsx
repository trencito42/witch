import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reportItems, reports, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { ChevronLeft, Globe, Calendar, FileCheck2 } from "lucide-react";
import { PrintButton } from "./print-button";

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

  const periodString = `${new Date(report.periodStart).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} — ${new Date(report.periodEnd).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-8 max-w-3xl animate-spectral-fade">
      {/* Navigation bar (hidden in print) */}
      <div className="flex items-center justify-between gap-4 no-print">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Reports</span>
        </Link>
        <PrintButton />
      </div>

      {/* Report Document Card */}
      <article className="p-8 sm:p-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] print:bg-white print:text-black print:border-none print:p-0 print:shadow-none space-y-8 shadow-sm">
        {/* Document Header */}
        <div className="pb-6 border-b border-[var(--border)] print:border-gray-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] print:text-emerald-700 mono">
              Executive SLA & Performance Audit
            </span>
            <span className="text-[11px] text-[var(--text-faint)] print:text-gray-500 mono">
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)] print:text-black">
            {report.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[var(--text-muted)] print:text-gray-600">
            {site && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[var(--text-faint)] print:text-gray-400" />
                <span className="font-medium text-[var(--text)] print:text-black">{site.name}</span>
                <span className="mono text-[11px] text-[var(--text-faint)] print:text-gray-500">
                  ({site.url})
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mono text-[12px]">
              <Calendar className="h-3.5 w-3.5 text-[var(--text-faint)] print:text-gray-400" />
              <span>{periodString}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Breakdown */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-[var(--text-muted)] print:text-gray-600 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-[var(--accent)] print:text-emerald-700" />
            Verified SLA Metrics
          </h2>

          <div className="divide-y divide-[var(--border)] print:divide-gray-200 border-t border-b border-[var(--border)] print:border-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex items-center justify-between gap-4 text-[13px] sm:text-[14px]"
              >
                <div>
                  <div className="font-medium text-[var(--text)] print:text-gray-900">
                    {item.label}
                  </div>
                  {item.detail && (
                    <div className="text-[12px] text-[var(--text-muted)] print:text-gray-500 mt-0.5">
                      {item.detail}
                    </div>
                  )}
                </div>
                <div className="mono font-semibold text-[var(--text)] print:text-black text-right shrink-0">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-[var(--border)] print:border-gray-200 flex items-center justify-between text-[11px] text-[var(--text-faint)] print:text-gray-500">
          <span>Continuous monitoring verified by Witch Digital Observatory</span>
          <span className="mono">ID: {report.id}</span>
        </div>
      </article>
    </div>
  );
}

