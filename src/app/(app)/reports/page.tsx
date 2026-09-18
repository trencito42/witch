import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Button } from "@/components/ui";
import { FileText, ArrowRight, Globe, Lock } from "lucide-react";

export default async function ReportsPage() {
  const ctx = await requireOrgContext();

  if (!ctx.plan.reports) {
    return (
      <div className="space-y-6 animate-spectral-fade">
        <PageHeader
          title="Executive Reports"
          description="Client-ready monthly uptime and visual regression summaries."
        />
        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] max-w-xl text-center space-y-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] mx-auto">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-[17px] font-medium text-[var(--text)]">
            Reports are available on Freelancer and above
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
            Generate clean, printable, agency-grade performance reports for clients covering uptime SLAs, incident resolution timelines, and visual integrity verification.
          </p>
          <div className="pt-2">
            <Link href="/settings">
              <Button variant="primary">View plans in Settings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rows = await db
    .select({
      report: reports,
      site: sites,
    })
    .from(reports)
    .leftJoin(sites, eq(sites.id, reports.siteId))
    .where(eq(reports.organizationId, ctx.organizationId))
    .orderBy(desc(reports.createdAt))
    .limit(50);

  return (
    <div className="space-y-6 animate-spectral-fade">
      <PageHeader
        title="Executive Reports"
        description="Printable monthly performance reports for clients and technical stakeholders."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No reports generated yet"
          description="Monthly reports are compiled automatically once sufficient telemetry data is gathered across your active sites."
          icon={<FileText className="h-6 w-6 text-[var(--accent)]" />}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ report, site }) => {
            const metrics = report.metrics as {
              uptime?: number;
              incidentCount?: number;
              averageResponseMs?: number;
            } | null;

            const periodName = new Date(report.periodStart).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            });

            return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="group flex flex-col justify-between p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all duration-200 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--accent)] mono">
                      {periodName}
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)]">
                      Generated {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-medium text-[var(--text)] group-hover:text-white transition-colors mb-1">
                    {report.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mb-4">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{site ? site.name : "Workspace Comprehensive"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-3 mono text-[var(--text-muted)]">
                    {metrics?.uptime != null && (
                      <span className="text-[var(--healthy)] font-medium">
                        {metrics.uptime.toFixed(1)}% uptime
                      </span>
                    )}
                    {metrics?.incidentCount != null && (
                      <span>{metrics.incidentCount} incidents</span>
                    )}
                  </div>

                  <span className="text-[12px] text-[var(--accent)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

