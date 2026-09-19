import Link from "next/link";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import {
  StatusBadge,
  StatusDot,
  Button,
  EmptyState,
  MetricCard,
} from "@/components/ui";
import { AddSiteButton, AddSiteCardButton } from "@/components/add-site-dialog";
import { SiteFavicon } from "@/components/site-favicon";
import { computeOrgHttpMetrics } from "@/features/reports/service";
import { loadSiteListStats } from "@/features/sites/stats";
import { isMonitoringStale } from "@/lib/monitor-freshness";
import {
  Globe,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";

function formatRelativeTime(date: Date | string | number): string {
  const target = typeof date === "object" ? date.getTime() : new Date(date).getTime();
  if (isNaN(target)) return "—";
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSeconds) < 60) {
    return "just now";
  } else if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  } else {
    return rtf.format(diffDays, "day");
  }
}

export default async function OverviewPage() {
  const ctx = await requireOrgContext();
  const orgSites = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId));

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [incidentCount] = await db
    .select({ value: count() })
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, ctx.organizationId),
        gte(incidents.firstDetectedAt, monthStart),
      ),
    );

  const recentIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.organizationId, ctx.organizationId))
    .orderBy(desc(incidents.lastDetectedAt))
    .limit(8);

  const recoveries = recentIncidents
    .filter((item) => item.status === "RESOLVED")
    .slice(0, 5);
  const attention = orgSites.filter((site) =>
    ["DOWN", "DEGRADED"].includes(site.status),
  );
  const staleSites = orgSites.filter(
    (site) => site.status !== "PAUSED" && isMonitoringStale(site),
  );
  const healthy = orgSites.filter((site) => site.status === "HEALTHY" && !isMonitoringStale(site)).length;

  const [recentChecks] = await db
    .select({ value: count() })
    .from(monitorChecks)
    .where(
      and(
        eq(monitorChecks.organizationId, ctx.organizationId),
        gte(monitorChecks.createdAt, new Date(Date.now() - 5 * 60 * 1000)),
      ),
    );

  let uptime = 100;
  let avgLatency = 0;
  if (orgSites.length) {
    const metrics = await computeOrgHttpMetrics(ctx.organizationId, thirty, new Date());
    uptime = metrics.uptime;
    avgLatency = metrics.averageResponseMs;
  }

  const { openBySite, lastBySite } = await loadSiteListStats(
    ctx.organizationId,
    orgSites.map((site) => site.id),
  );

  // Status header config
  let headerConfig: {
    statusType: "healthy" | "critical" | "warning" | "neutral";
    surfaceClass: string;
    iconBoxClass: string;
    icon: React.ReactNode;
    title: string;
    description: string;
  };

  if (orgSites.length === 0) {
    headerConfig = {
      statusType: "neutral",
      surfaceClass: "border-[var(--border)] bg-[var(--surface-raised)]",
      iconBoxClass: "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
      icon: <Globe className="h-6 w-6" aria-hidden="true" />,
      title: "No websites under watch yet",
      description: ctx.plan.browserMonitoring
        ? "Add your first site to start HTTP checks, browser rendering, and visual baselines."
        : "Add your first site to start HTTP, TLS, and latency checks.",
    };
  } else if (attention.length > 0) {
    headerConfig = {
      statusType: "critical",
      surfaceClass: "border-[var(--critical)]/25 bg-[var(--critical-dim)]/40",
      iconBoxClass: "border-[var(--critical)]/30 bg-[var(--critical-dim)] text-[var(--critical)]",
      icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" />,
      title: `${attention.length} ${attention.length === 1 ? "site needs" : "sites need"} attention`,
      description: "Incidents or downtime detected across your monitored sites. Review them below.",
    };
  } else if (staleSites.length > 0) {
    headerConfig = {
      statusType: "warning",
      surfaceClass: "border-[var(--warning)]/25 bg-[var(--warning-dim)]/40",
      iconBoxClass: "border-[var(--warning)]/30 bg-[var(--warning-dim)] text-[var(--warning)]",
      icon: <Clock className="h-6 w-6" aria-hidden="true" />,
      title: "Monitoring looks delayed",
      description: "Expected checks are overdue. Confirm the worker is running.",
    };
  } else {
    headerConfig = {
      statusType: "healthy",
      surfaceClass: "border-[var(--healthy)]/25 bg-[var(--healthy-dim)]/30",
      iconBoxClass: "border-[var(--healthy)]/30 bg-[var(--healthy-dim)] text-[var(--healthy)]",
      icon: <ShieldCheck className="h-6 w-6" aria-hidden="true" />,
      title: "All monitored sites are healthy",
      description: `Witch completed ${Number(recentChecks?.value ?? 0)} checks in the last 5 minutes.`,
    };
  }

  const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const uptimeFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const latencyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  const atSiteLimit =
    Number.isFinite(ctx.plan.maxSites) && orgSites.length >= ctx.plan.maxSites;

  return (
    <div className="space-y-8">
      {/* STATUS HEADER */}
      <section
        aria-label="Workspace Status"
        className={`rounded-xl border p-5 sm:p-6 transition-colors ${headerConfig.surfaceClass}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            {/* Mobile: icon and headline on one row */}
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border ${headerConfig.iconBoxClass}`}
              >
                {headerConfig.icon}
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[var(--text)] truncate">
                {headerConfig.title}
              </h1>
            </div>
            {/* Sentence below */}
            <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed">
              {headerConfig.description}
            </p>
          </div>

          {/* Add site button: full width below on mobile, right of header from 640px */}
          <div className="w-full sm:w-auto shrink-0">
            <AddSiteButton
              browserMonitoring={ctx.plan.browserMonitoring}
              disabled={atSiteLimit}
              className="w-full sm:w-auto justify-center min-h-[44px]"
            >
              {atSiteLimit ? "Site limit reached" : "Add site"}
            </AddSiteButton>
          </div>
        </div>
      </section>

      {orgSites.length === 0 ? (
        <EmptyState
          title="No websites under watch"
          description={
            ctx.plan.browserMonitoring
              ? "Add your first website to start HTTP checks, Chromium rendering, and visual baseline comparisons."
              : "Add your first website to start HTTP, TLS, and latency monitoring."
          }
          action={
            <Link href="/onboarding">
              <Button leadingIcon={<Plus className="h-4 w-4" />}>
                Add your first website
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <MetricCard
              label="Sites monitored"
              value={integerFormatter.format(orgSites.length)}
              secondary={
                healthy === 0
                  ? "None operational yet"
                  : `${integerFormatter.format(healthy)} operational`
              }
            />
            <MetricCard
              label="Healthy sites"
              value={integerFormatter.format(healthy)}
              secondary={`${orgSites.length ? integerFormatter.format(Math.round((healthy / orgSites.length) * 100)) : 0}% of your sites`}
            />
            <MetricCard
              label="Sites needing attention"
              value={
                attention.length > 0 ? (
                  <span className="text-[var(--critical)]">
                    {integerFormatter.format(attention.length)}
                  </span>
                ) : (
                  integerFormatter.format(attention.length)
                )
              }
              secondary={
                attention.length > 0
                  ? `${integerFormatter.format(attention.length)} down or degraded`
                  : "All sites operational"
              }
            />
            <MetricCard
              label="Workspace 30d uptime"
              value={`${uptimeFormatter.format(uptime)}%`}
              secondary={
                avgLatency
                  ? `Average latency ${latencyFormatter.format(Math.round(avgLatency))} ms`
                  : "No latency data yet"
              }
            />
            <MetricCard
              className="col-span-2 sm:col-span-2 xl:col-span-1"
              label="Incidents this month"
              value={integerFormatter.format(Number(incidentCount?.value ?? 0))}
              secondary={
                recoveries.length > 0
                  ? `${integerFormatter.format(recoveries.length)} recovered`
                  : "No recoveries this month"
              }
            />
          </div>

          {/* SITES UNDER WATCH */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-normal tracking-tight text-[var(--text)]">
                  Sites Under Watch
                </h2>
                <p className="text-[13px] text-[var(--text-muted)]">
                  HTTP checks plus visual diffs on paid plans
                </p>
              </div>
              <Link
                href="/sites"
                className="inline-flex items-center gap-1 min-h-[44px] text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] rounded-md px-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {orgSites.map((site) => {
                const last = lastBySite.get(site.id);
                const openIncidents = openBySite.get(site.id) ?? 0;
                const checkDate = last?.createdAt ?? site.lastCheckedAt;
                const relTime = checkDate ? formatRelativeTime(checkDate) : "Never checked";
                const absTime = checkDate
                  ? new Date(checkDate).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    })
                  : undefined;

                return (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="group flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 [@media(pointer:fine)]:hover:bg-[var(--bg-hover)] [@media(pointer:fine)]:hover:border-[var(--border-strong)]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SiteFavicon
                            faviconUrl={site.faviconUrl}
                            url={site.url}
                            name={site.name}
                            size={20}
                          />
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-medium text-[var(--text)] truncate">
                              {site.name}
                            </h3>
                            <p
                              className="font-mono text-[12px] text-[var(--text-muted)] truncate"
                              title={site.url}
                            >
                              {site.url}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={site.status} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-[var(--text-faint)]" aria-hidden="true" />
                        <span title={absTime}>{relTime}</span>
                        {last?.durationMs != null && (
                          <span>· {Math.round(last.durationMs)} ms</span>
                        )}
                      </div>

                      {openIncidents > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--critical-dim)] text-[var(--critical)] border border-[var(--critical)]/20">
                          {openIncidents} {openIncidents === 1 ? "incident" : "incidents"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--healthy-dim)] text-[var(--healthy)] border border-[var(--healthy)]/20">
                          Stable
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {orgSites.length <= 3 && !atSiteLimit && (
                <AddSiteCardButton browserMonitoring={ctx.plan.browserMonitoring} />
              )}
            </div>
          </section>

          {/* ACTIVITY & INCIDENT LOG */}
          <div className="grid lg:grid-cols-12 gap-8 pt-2">
            {/* Recent Incidents (60% on desktop) */}
            <section className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-normal tracking-tight text-[var(--text)] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--warning)]" aria-hidden="true" />
                  Recent Incidents
                </h2>
                <Link
                  href="/incidents"
                  className="inline-flex items-center gap-1 min-h-[44px] text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] rounded-md px-1"
                >
                  <span>View all</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {recentIncidents.length === 0 ? (
                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-center text-[13px] text-[var(--text-muted)]">
                  <ShieldCheck className="h-6 w-6 text-[var(--healthy)] mx-auto mb-2 opacity-80" aria-hidden="true" />
                  No incidents recorded. Witch is quietly watching.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentIncidents.map((incident) => {
                    const siteName =
                      orgSites.find((s) => s.id === incident.siteId)?.name ?? "Monitored Site";
                    const incidentRelTime = formatRelativeTime(incident.lastDetectedAt);
                    const incidentAbsTime = new Date(incident.lastDetectedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    });

                    return (
                      <Link
                        key={incident.id}
                        href={`/incidents/${incident.id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] min-h-[64px] gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 [@media(pointer:fine)]:hover:bg-[var(--bg-hover)] [@media(pointer:fine)]:hover:border-[var(--border-strong)]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[13px] font-medium text-[var(--text)] truncate">
                              {incident.title}
                            </span>
                            <span className="text-[12px] text-[var(--text-muted)] shrink-0">·</span>
                            <span className="text-[12px] font-medium text-[var(--text-muted)] truncate">
                              {siteName}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-1">
                            <span
                              title={incidentAbsTime}
                              className="font-mono text-[var(--text-muted)]"
                            >
                              {incidentRelTime}
                            </span>
                            <span>·</span>
                            <span className="font-mono uppercase tracking-wider text-[var(--text-faint)]">
                              {incident.category}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={incident.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Recoveries (40% on desktop) */}
            <section className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-normal tracking-tight text-[var(--text)] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--healthy)]" aria-hidden="true" />
                  Recent Recoveries
                </h2>
                <Link
                  href="/incidents"
                  className="inline-flex items-center gap-1 min-h-[44px] text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] rounded-md px-1"
                >
                  <span>View all</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {recoveries.length === 0 ? (
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[13px] text-[var(--text-muted)] leading-relaxed">
                  No recoveries yet. Resolved incidents will show up here.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recoveries.map((incident) => {
                    const siteName =
                      orgSites.find((s) => s.id === incident.siteId)?.name ?? "Monitored Site";
                    const recoveryRelTime = formatRelativeTime(
                      incident.resolvedAt ?? incident.lastDetectedAt,
                    );
                    const recoveryAbsTime = new Date(
                      incident.resolvedAt ?? incident.lastDetectedAt,
                    ).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    });

                    return (
                      <Link
                        key={incident.id}
                        href={`/incidents/${incident.id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] min-h-[64px] gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 [@media(pointer:fine)]:hover:bg-[var(--bg-hover)] [@media(pointer:fine)]:hover:border-[var(--border-strong)]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[13px] font-medium text-[var(--text)] truncate">
                              {incident.title}
                            </span>
                            <span className="text-[12px] text-[var(--text-muted)] shrink-0">·</span>
                            <span className="text-[12px] font-medium text-[var(--text-muted)] truncate">
                              {siteName}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--healthy)] flex items-center gap-1.5 mt-1">
                            <StatusDot status="RESOLVED" size="sm" />
                            <span>Recovered</span>
                            <span className="text-[var(--text-faint)]">·</span>
                            <span
                              title={recoveryAbsTime}
                              className="font-mono text-[var(--text-muted)]"
                            >
                              {recoveryRelTime}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status="RESOLVED" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

