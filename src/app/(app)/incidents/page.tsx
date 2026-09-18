import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import {
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from "@/components/ui";
import {
  Search,
  ArrowRight,
  Globe,
  CheckCircle2,
} from "lucide-react";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; severity?: string }>;
}) {
  const ctx = await requireOrgContext();
  const params = await searchParams;
  const rawRows = await db
    .select({ incident: incidents, site: sites })
    .from(incidents)
    .innerJoin(sites, eq(sites.id, incidents.siteId))
    .where(eq(incidents.organizationId, ctx.organizationId))
    .orderBy(desc(incidents.lastDetectedAt))
    .limit(100);

  const query = (params.q ?? "").toLowerCase();
  const statusFilter = (params.status ?? "all").toUpperCase();
  const severityFilter = (params.severity ?? "all").toUpperCase();

  const openCount = rawRows.filter((r) => r.incident.status === "OPEN").length;
  const ackCount = rawRows.filter((r) => r.incident.status === "ACKNOWLEDGED").length;
  const resolvedCount = rawRows.filter((r) => r.incident.status === "RESOLVED").length;

  const filtered = rawRows.filter(({ incident, site }) => {
    if (query && !`${incident.title} ${incident.summary} ${site.name}`.toLowerCase().includes(query)) {
      return false;
    }
    if (statusFilter !== "ALL" && incident.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && incident.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-spectral-fade">
      <PageHeader
        title="Incidents"
        description="Open issues, visual diffs, and recent recovered incidents."
      />

      {rawRows.length === 0 ? (
        <EmptyState
          title="Nothing needs your attention"
          description="Witch is quietly monitoring your websites. No incidents or regressions have been detected."
          icon={<CheckCircle2 className="h-6 w-6 text-[var(--healthy)]" />}
        />
      ) : (
        <>
          {/* CONTROLS: STATUS FILTER & SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={statusFilter.toLowerCase()}
                items={[
                  { id: "all", label: "All Status", count: rawRows.length, href: `/incidents?status=all${query ? `&q=${query}` : ""}` },
                  { id: "open", label: "Open", count: openCount, href: `/incidents?status=open${query ? `&q=${query}` : ""}` },
                  { id: "acknowledged", label: "Acknowledged", count: ackCount, href: `/incidents?status=acknowledged${query ? `&q=${query}` : ""}` },
                  { id: "resolved", label: "Resolved", count: resolvedCount, href: `/incidents?status=resolved${query ? `&q=${query}` : ""}` },
                ]}
              />
            </div>

            <form className="relative flex items-center w-full md:w-64">
              <Search className="absolute left-3 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Search incidents or sites…"
                className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-3 text-[16px] text-[var(--text)] transition-colors focus:border-[var(--border-focus)] focus:bg-[var(--bg-card)] focus:outline-none placeholder:text-[var(--text-faint)] md:h-9 md:text-[13px]"
              />
              {statusFilter !== "ALL" && <input type="hidden" name="status" value={statusFilter.toLowerCase()} />}
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/50 text-[13px] text-[var(--text-muted)]">
              No incidents match the active search query or filter.
            </div>
          ) : (
            <>
              {/* DESKTOP RICH ROWS */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xs">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/60 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Incident</th>
                      <th className="py-3 px-4">Monitored Service</th>
                      <th className="py-3 px-4">Detected</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Investigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map(({ incident, site }) => (
                      <tr
                        key={incident.id}
                        className="hover:bg-[var(--bg-hover)] transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <StatusBadge status={incident.severity} />
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <Link href={`/incidents/${incident.id}`} className="block">
                            <div className="font-medium text-[var(--text)] group-hover:text-white transition-colors truncate">
                              {incident.title}
                            </div>
                            <div className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                              {incident.summary}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/sites/${site.id}`}
                            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          >
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{site.name}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 mono text-[12px] text-[var(--text-muted)]">
                          {new Date(incident.lastDetectedAt).toLocaleDateString()}{" "}
                          {new Date(incident.lastDetectedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={incident.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-3">
                {filtered.map(({ incident, site }) => (
                  <Link
                    key={incident.id}
                    href={`/incidents/${incident.id}`}
                    className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] active:bg-[var(--bg-hover)] transition-colors min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <StatusBadge status={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>

                    <h3 className="text-[15px] font-medium text-[var(--text)] mb-1 break-words">
                      {incident.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 mb-3">
                      {incident.summary}
                    </p>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="truncate">{site.name}</span>
                      <span className="mono shrink-0">
                        {new Date(incident.lastDetectedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

