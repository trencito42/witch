import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import {
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from "@/components/ui";
import { AddSiteButton } from "@/components/add-site-dialog";
import { SiteFavicon } from "@/components/site-favicon";
import { ChevronRight, Clock, Search } from "lucide-react";
import { loadSiteListStats } from "@/features/sites/stats";
import { siteWatchPresentation } from "@/lib/monitor-freshness";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const ctx = await requireOrgContext();
  const params = await searchParams;
  const all = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId))
    .orderBy(desc(sites.updatedAt));

  const query = (params.q ?? "").toLowerCase();
  const filter = params.filter ?? "all";

  const healthyCount = all.filter((s) => s.status === "HEALTHY").length;
  const issuesCount = all.filter((s) => ["DOWN", "DEGRADED"].includes(s.status)).length;
  const pausedCount = all.filter((s) => s.status === "PAUSED").length;

  const filtered = all.filter((site) => {
    if (query && !`${site.name} ${site.url}`.toLowerCase().includes(query)) return false;
    if (filter === "healthy") return site.status === "HEALTHY";
    if (filter === "issues") return ["DOWN", "DEGRADED"].includes(site.status);
    if (filter === "paused") return site.status === "PAUSED";
    return true;
  });

  const { openBySite, lastBySite } = await loadSiteListStats(
    ctx.organizationId,
    filtered.map((site) => site.id),
  );

  return (
    <div className="space-y-6 animate-spectral-fade">
      <PageHeader
        title="Sites"
        description="HTTP checks, visual diffs, and the sites Witch is watching."
        actions={<AddSiteButton browserMonitoring={ctx.plan.browserMonitoring} />}
      />

      {all.length === 0 ? (
        <EmptyState
          title="Nothing under watch yet"
          description={
            ctx.plan.browserMonitoring
              ? "Add your first website. Witch will run HTTP checks and capture desktop and mobile baselines."
              : "Add your first website to start HTTP monitoring."
          }
          action={<AddSiteButton browserMonitoring={ctx.plan.browserMonitoring} />}
        />
      ) : (
        <>
          {/* FILTER BAR & SEARCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <SegmentedControl
              className="w-full sm:w-auto"
              value={filter}
              items={[
                { id: "all", label: "All", count: all.length, href: `/sites?filter=all${query ? `&q=${query}` : ""}` },
                { id: "healthy", label: "Healthy", count: healthyCount, href: `/sites?filter=healthy${query ? `&q=${query}` : ""}` },
                { id: "issues", label: "Issues", count: issuesCount, href: `/sites?filter=issues${query ? `&q=${query}` : ""}` },
                { id: "paused", label: "Paused", count: pausedCount, href: `/sites?filter=paused${query ? `&q=${query}` : ""}` },
              ]}
            />

            <form className="relative flex items-center w-full sm:w-64">
              <Search className="absolute left-3 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Filter sites or URLs…"
                className="h-11 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-3 text-[16px] text-[var(--text)] transition-colors focus:border-[var(--border-focus)] focus:bg-[var(--bg-card)] focus:outline-none placeholder:text-[var(--text-faint)] md:h-9 md:text-[13px]"
              />
              {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/50 text-[13px] text-[var(--text-muted)]">
              No websites match the query &quot;{query}&quot; or selected filter.
            </div>
          ) : (
            <>
              {/* DESKTOP HYBRID OBSERVATORY TABLE (md and up) */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xs">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/60 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Telemetry</th>
                      <th className="py-3 px-4">Open Incidents</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((site) => (
                      <SiteTableRow
                        key={site.id}
                        site={site}
                        openIncidents={openBySite.get(site.id) ?? 0}
                        lastDurationMs={lastBySite.get(site.id)?.durationMs ?? null}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS (below md) */}
              <div className="md:hidden space-y-3">
                {filtered.map((site) => (
                  <SiteMobileCard
                    key={site.id}
                    site={site}
                    openIncidents={openBySite.get(site.id) ?? 0}
                    lastDurationMs={lastBySite.get(site.id)?.durationMs ?? null}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SiteTableRow({
  site,
  openIncidents,
  lastDurationMs,
}: {
  site: typeof sites.$inferSelect;
  openIncidents: number;
  lastDurationMs: number | null;
}) {
  return (
    <tr className="hover:bg-[var(--bg-hover)] transition-colors group">
      <td className="py-3.5 px-4">
        <Link href={`/sites/${site.id}`} className="flex items-center gap-2.5">
          <SiteFavicon
            faviconUrl={site.faviconUrl}
            url={site.url}
            name={site.name}
            size={18}
          />
          <div className="min-w-0">
            <div className="font-medium text-[var(--text)] group-hover:text-white transition-colors">
              {site.name}
            </div>
            <div className="mono text-[11px] text-[var(--text-faint)] truncate max-w-xs">
              {site.url}
            </div>
          </div>
        </Link>
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={siteWatchPresentation(site).status} label={siteWatchPresentation(site).label} />
      </td>
      <td className="py-3.5 px-4 text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5 mono text-[12px]">
          <Clock className="h-3 w-3 text-[var(--text-faint)]" />
          <span>
            {site.lastCheckedAt
              ? new Date(site.lastCheckedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
          {lastDurationMs != null && (
            <span className="text-[var(--text-faint)]">· {lastDurationMs}ms</span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4">
        {openIncidents > 0 ? (
          <span className="text-[var(--critical)] text-[12px] font-medium">
            {openIncidents} active
          </span>
        ) : (
          <span className="text-[var(--text-faint)] text-[12px]">None</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-right">
        <Link
          href={`/sites/${site.id}`}
          className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <span>Inspect</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

function SiteMobileCard({
  site,
  openIncidents,
  lastDurationMs,
}: {
  site: typeof sites.$inferSelect;
  openIncidents: number;
  lastDurationMs: number | null;
}) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] active:bg-[var(--bg-hover)] transition-colors min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 min-w-0 mb-1.5">
        <SiteFavicon
          faviconUrl={site.faviconUrl}
          url={site.url}
          name={site.name}
          size={16}
        />
        <span className="text-[15px] font-medium text-[var(--text)] truncate">
          {site.name}
        </span>
      </div>

      <div className="mono text-[12px] text-[var(--text-muted)] truncate mb-3 min-w-0">
        {site.url}
      </div>

      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 min-w-0 text-[12px] text-[var(--text-muted)]">
        <div className="mono truncate min-w-0">
          {lastDurationMs != null ? `${lastDurationMs}ms` : "—"} ·{" "}
          {site.lastCheckedAt
            ? new Date(site.lastCheckedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never"}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {openIncidents > 0 ? (
            <span className="text-[var(--critical)] font-medium whitespace-nowrap">
              {openIncidents} open
            </span>
          ) : (
            <span className="text-[var(--healthy)]">Stable</span>
          )}
          <StatusBadge status={siteWatchPresentation(site).status} label={siteWatchPresentation(site).label} />
        </div>
      </div>
    </Link>
  );
}

