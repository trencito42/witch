import { notFound } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks, monitors, organizations, sites, subscriptions } from "@/db/schema";
import { StatusBadge, Badge } from "@/components/ui";
import { Wordmark } from "@/components/logo";
import { Globe, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import { UptimeHistoryBar, type DayUptime } from "@/components/uptime-history-bar";
import { StatusSubscribeDialog } from "@/components/status-subscribe-dialog";
import { emailEnabled } from "@/lib/env";
import { canUseEmailAlerts, getEffectivePlan } from "@/lib/plans";

type DailyHttpCheck = {
  siteId: string;
  day: string;
  total: number;
  successful: number;
};

function buildSite90Days(
  siteId: string,
  siteStatus: string,
  siteIncidents: Array<typeof incidents.$inferSelect>,
  dailyChecks: DailyHttpCheck[],
  now: Date,
) {
  const days: DayUptime[] = [];
  const siteChecks = dailyChecks.filter((row) => row.siteId === siteId);
  const totalChecks = siteChecks.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const successfulChecks = siteChecks.reduce((sum, row) => sum + Number(row.successful || 0), 0);

  for (let i = 89; i >= 0; i--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - i);
    dayDate.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    const isoDate = dayDate.toISOString().slice(0, 10);
    const dateStr = dayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const matchingIncidents = siteIncidents.filter((inc) => {
      if (inc.siteId !== siteId) return false;
      const start = inc.firstDetectedAt;
      const end = inc.resolvedAt || now;
      return start <= dayEnd && end >= dayDate;
    });
    const daily = siteChecks.find((row) => row.day === isoDate);

    let status: DayUptime["status"] = "unknown";
    let summary: string | undefined;

    if (siteStatus === "PAUSED" && i === 0) {
      status = "paused";
    } else if (matchingIncidents.length > 0) {
      const hasCritical = matchingIncidents.some(
        (inc) => inc.severity === "CRITICAL" || inc.severity === "HIGH",
      );
      status = hasCritical ? "down" : "degraded";
      summary = matchingIncidents.map((inc) => inc.title).join(", ");
    } else if (daily && Number(daily.total) > 0) {
      status = Number(daily.successful) === Number(daily.total) ? "operational" : "degraded";
      if (status === "degraded") {
        summary = String(Number(daily.total) - Number(daily.successful)) + " failed HTTP check(s)";
      }
    }

    days.push({
      dateStr,
      isoDate,
      status,
      incidentCount: matchingIncidents.length,
      incidentSummary: summary,
    });
  }

  const uptimePercentage =
    totalChecks > 0 ? Math.min(100, Math.round((successfulChecks / totalChecks) * 10000) / 100) : null;

  return { days, uptimePercentage, totalChecks };
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [org] = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.statusPageSlug, slug), eq(organizations.statusPageEnabled, true)))
    .limit(1);

  if (!org) notFound();

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, org.id))
    .limit(1);

  const orgSites = await db
    .select()
    .from(sites)
    .where(and(eq(sites.organizationId, org.id), eq(sites.statusPageVisible, true)));

  const hasDown = orgSites.some((site) => site.status === "DOWN");
  const hasDegraded = orgSites.some((site) => site.status === "DEGRADED");
  const liveSites = orgSites.filter((site) => !["PAUSED", "UNKNOWN"].includes(site.status));
  const allPaused = orgSites.length > 0 && orgSites.every((site) => site.status === "PAUSED");
  const unknownOnly =
    orgSites.length > 0 &&
    !hasDown &&
    !hasDegraded &&
    liveSites.length === 0 &&
    orgSites.some((site) => site.status === "UNKNOWN");

  const noPublicSites = orgSites.length === 0;

  const overallStatus = noPublicSites
    ? "neutral"
    : hasDown
      ? "critical"
      : hasDegraded
        ? "warning"
        : allPaused
          ? "neutral"
          : unknownOnly
            ? "warning"
            : "healthy";

  const overallLabel = noPublicSites
    ? "No Public Services"
    : hasDown
      ? "Major Service Disruption"
      : hasDegraded
        ? "Active Service Degradation"
        : allPaused
          ? "Monitoring Paused"
          : unknownOnly
            ? "Status Unknown"
            : "All Systems Operational";

  const visibleIds = orgSites.map((site) => site.id);
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const pastIncidents = visibleIds.length
    ? await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.organizationId, org.id),
            inArray(incidents.siteId, visibleIds),
            gte(incidents.firstDetectedAt, ninetyDaysAgo),
            inArray(incidents.status, ["OPEN", "ACKNOWLEDGED", "RESOLVED"]),
          ),
        )
        .orderBy(desc(incidents.firstDetectedAt))
        .limit(500)
    : [];

  const dailyHttpChecks = visibleIds.length
    ? await db
        .select({
          siteId: monitorChecks.siteId,
          day: sql<string>`DATE(${monitorChecks.createdAt})`,
          total: sql<number>`COUNT(*)`,
          successful: sql<number>`SUM(CASE WHEN ${monitorChecks.success} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(monitorChecks)
        .innerJoin(monitors, eq(monitors.id, monitorChecks.monitorId))
        .where(
          and(
            inArray(monitorChecks.siteId, visibleIds),
            eq(monitors.type, "HTTP"),
            gte(monitorChecks.createdAt, ninetyDaysAgo),
          ),
        )
        .groupBy(monitorChecks.siteId, sql`DATE(${monitorChecks.createdAt})`)
    : [];

  const freshestCheck = orgSites
    .map((site) => site.lastCheckedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const fresh =
    freshestCheck && Date.now() - freshestCheck.getTime() < 2 * 60 * 60 * 1000;

  const showHistoryBars = org.statusPageShowHistoryBars ?? true;
  const allowSubscribe = Boolean(org.statusPageAllowSubscribe) && emailEnabled() && canUseEmailAlerts(getEffectivePlan(subscription).id);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text)] flex flex-col selection:bg-[var(--accent)]/30 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[var(--border)] bg-[var(--surface-raised)]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-semibold text-sm shadow-xs">
              {org.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-serif text-[18px] tracking-tight font-medium text-[var(--text)]">
              {org.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {allowSubscribe && (
              <StatusSubscribeDialog
                organizationId={org.id}
                organizationName={org.name}
              />
            )}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <Wordmark size="mobile" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 sm:px-8 py-10 sm:py-14 space-y-10">
        {/* Status Hero Card */}
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 sm:p-9 shadow-sm overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-[3px] ${
              overallStatus === "healthy"
                ? "bg-[var(--healthy)]"
                : overallStatus === "warning"
                  ? "bg-[var(--warning)]"
                  : overallStatus === "critical"
                    ? "bg-[var(--critical)]"
                    : "bg-[var(--text-faint)]"
            }`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={overallStatus}
                  label={overallLabel}
                />
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)] mt-3">
                {org.statusPageHeadline || overallLabel}
              </h1>

              <p className="mt-2 text-[14px] text-[var(--text-muted)] max-w-xl leading-relaxed">
                {org.statusPageSubheadline ||
                  "Automated website monitoring and incident transparency for the services published here."}
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-[var(--border)] shrink-0">
              <div className="flex items-center sm:justify-end gap-1.5 text-[12px] font-mono text-[var(--text-faint)]">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {freshestCheck
                    ? fresh
                      ? `Updated ${Math.max(1, Math.round((Date.now() - freshestCheck.getTime()) / 60000))}m ago`
                      : `Updated ${freshestCheck.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "No telemetry recorded"}
                </span>
              </div>
              <div className="text-[13px] text-[var(--text-muted)] mt-1 font-medium">
                {orgSites.length} {orgSites.length === 1 ? "endpoint" : "endpoints"} monitored
              </div>
            </div>
          </div>
        </div>

        {/* Monitored Services & Visual Uptime Bars */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight text-[var(--text)]">
              Services &amp; Endpoints
            </h2>
            <span className="text-[12px] font-mono text-[var(--text-faint)]">
              Monitored status
            </span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
            {orgSites.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-[var(--text-muted)]">
                No services are currently set to public visibility.
              </div>
            ) : (
              orgSites.map((site) => {
                const siteStatus =
                  site.status === "DOWN"
                    ? "critical"
                    : site.status === "DEGRADED"
                      ? "warning"
                      : site.status === "PAUSED"
                        ? "neutral"
                        : site.status === "UNKNOWN"
                          ? "warning"
                          : "healthy";

                const badgeLabel =
                  site.status === "DOWN"
                    ? "Outage"
                    : site.status === "DEGRADED"
                      ? "Degraded"
                      : site.status === "PAUSED"
                        ? "Paused"
                        : site.status === "UNKNOWN"
                          ? "Unknown"
                          : "Operational";

                const historyData = buildSite90Days(site.id, site.status, pastIncidents, dailyHttpChecks, now);

                return (
                  <div key={site.id} className="p-5 sm:p-6 space-y-4 hover:bg-[var(--surface-overlay)]/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--surface-overlay)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-medium text-[var(--text)]">
                            {site.name}
                          </h3>
                          {site.normalizedUrl && (
                            <a
                              href={site.normalizedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                            >
                              <span>{site.normalizedUrl}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center self-start sm:self-center pl-12 sm:pl-0">
                        <StatusBadge status={siteStatus} label={badgeLabel} />
                      </div>
                    </div>

                    {showHistoryBars && (
                      <div className="pt-2 sm:pl-12">
                        <UptimeHistoryBar
                          days={historyData.days}
                          uptimePercentage={historyData.uptimePercentage}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Incidents & Maintenance Timeline */}
        <section className="space-y-4 pt-2">
          <h2 className="font-serif text-xl font-medium tracking-tight text-[var(--text)]">
            Incident History
          </h2>

          {pastIncidents.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[var(--healthy-dim)] border border-[var(--healthy)]/20 text-[var(--healthy)] mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[var(--text)]">
                No incidents reported
              </h3>
              <p className="text-[13px] text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                No public incidents are recorded in this 90-day window. HTTP uptime is shown only for periods where Witch has actual check data.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
              {pastIncidents.slice(0, 50).map((incident) => {
                const isResolved = incident.status === "RESOLVED";
                const isCritical = incident.severity === "CRITICAL" || incident.severity === "HIGH";

                return (
                  <div key={incident.id} className="p-5 sm:p-6 space-y-2 hover:bg-[var(--surface-overlay)]/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isResolved
                              ? "bg-[var(--healthy)]"
                              : isCritical
                                ? "bg-[var(--critical)]"
                                : "bg-[var(--warning)]"
                          }`}
                        />
                        <h4 className="text-[14px] font-medium text-[var(--text)]">
                          {incident.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge
                          variant={
                            isResolved
                              ? "healthy"
                              : incident.status === "ACKNOWLEDGED"
                                ? "warning"
                                : "critical"
                          }
                          size="sm"
                        >
                          {incident.status}
                        </Badge>
                      </div>
                    </div>

                    {incident.summary && (
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed pl-4.5">
                        {incident.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-faint)] pl-4.5 pt-1">
                      <span>
                        Detected: {incident.firstDetectedAt.toISOString().slice(0, 10)}{" "}
                        {incident.firstDetectedAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {incident.resolvedAt && (
                        <>
                          <span>·</span>
                          <span>
                            Resolved: {incident.resolvedAt.toISOString().slice(0, 10)}{" "}
                            {incident.resolvedAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="capitalize">{incident.severity.toLowerCase()} severity</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-12 text-center text-[12px] text-[var(--text-muted)] bg-[var(--surface-raised)]/50">
        <div className="flex items-center justify-center mb-2">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Wordmark />
          </Link>
        </div>
        <p className="text-[11px] text-[var(--text-faint)]">
          Quiet, automated website monitoring beyond uptime.
        </p>
      </footer>
    </div>
  );
}
