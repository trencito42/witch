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
  HealthBeacon,
} from "@/components/ui";
import { computeSiteMetrics } from "@/features/reports/service";
import {
  Globe,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

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
  const healthy = orgSites.filter((site) => site.status === "HEALTHY").length;

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
  if (orgSites[0]) {
    const metrics = await computeSiteMetrics(
      ctx.organizationId,
      orgSites[0].id,
      thirty,
      new Date(),
    );
    uptime = metrics.uptime;
    avgLatency = metrics.averageResponseMs;
  }

  // Fetch last checks for each site
  const siteChecks = await Promise.all(
    orgSites.map(async (site) => {
      const [lastCheck] = await db
        .select()
        .from(monitorChecks)
        .where(eq(monitorChecks.siteId, site.id))
        .orderBy(desc(monitorChecks.createdAt))
        .limit(1);

      const [open] = await db
        .select({ value: count() })
        .from(incidents)
        .where(
          and(
            eq(incidents.siteId, site.id),
            eq(incidents.organizationId, ctx.organizationId),
            eq(incidents.status, "OPEN"),
          ),
        );

      return {
        siteId: site.id,
        lastDurationMs: lastCheck?.durationMs,
        lastCheckedAt: lastCheck?.createdAt ?? site.lastCheckedAt,
        openIncidents: Number(open?.value ?? 0),
      };
    }),
  );

  const siteDataMap = new Map(siteChecks.map((s) => [s.siteId, s]));

  const overallStatus =
    attention.length > 0
      ? attention.some((s) => s.status === "DOWN")
        ? "critical"
        : "warning"
      : "healthy";

  return (
    <div className="space-y-10 animate-spectral-fade">
      {/* OBSERVATORY HEALTH HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-card)] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[var(--accent-glow)]/20 to-transparent pointer-events-none -mr-20 -mt-20 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <HealthBeacon status={overallStatus} size="lg" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium tracking-wider uppercase text-[var(--accent)] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Observatory Status
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)]">
                {orgSites.length === 0
                  ? "Digital Observatory Standby"
                  : attention.length === 0
                    ? "Everything is quiet."
                    : `${attention.length} ${attention.length === 1 ? "site requires" : "sites require"} attention.`}
              </h1>
              <p className="text-[13px] sm:text-[14px] text-[var(--text-muted)] max-w-xl leading-relaxed">
                {orgSites.length === 0
                  ? "Connect your first web service to initiate automated synthetic monitoring and visual regression detection."
                  : attention.length === 0
                    ? `Witch completed ${Number(recentChecks?.value ?? 0)} checks in the last 5 minutes. All telemetry feeds report normal baseline behavior.`
                    : `Active incidents detected across monitored sites. Review evidence logs below.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <Link href="/sites">
              <Button
                variant="primary"
                leadingIcon={<Plus className="h-4 w-4" />}
              >
                Add site
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {orgSites.length === 0 ? (
        <EmptyState
          title="No websites under watch"
          description="Add your first website to deploy synthetic HTTP health checks, Chromium rendering, and automated visual baseline diffing."
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
          {/* OBSERVATORY METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <MetricCard
              label="Sites Monitored"
              value={orgSites.length}
              secondary={`${healthy} operational`}
              indicator="neutral"
            />
            <MetricCard
              label="Healthy"
              value={healthy}
              indicator="healthy"
              secondary={
                <span className="text-[var(--healthy)] flex items-center gap-1">
                  <StatusDot status="HEALTHY" size="sm" /> 100% stable
                </span>
              }
            />
            <MetricCard
              label="Open Issues"
              value={attention.length}
              indicator={attention.length > 0 ? "critical" : "neutral"}
              secondary={
                attention.length > 0 ? (
                  <span className="text-[var(--critical)]">attention needed</span>
                ) : (
                  <span className="text-[var(--text-muted)]">none</span>
                )
              }
            />
            <MetricCard
              label="30d Avg Uptime"
              value={`${uptime.toFixed(2)}%`}
              indicator="healthy"
              secondary={avgLatency ? `${avgLatency}ms avg` : undefined}
            />
            <MetricCard
              label="Incidents (Month)"
              value={String(incidentCount?.value ?? 0)}
              indicator="neutral"
              secondary={`${recoveries.length} recovered`}
            />
          </div>

          {/* SITES UNDER WATCH */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-medium tracking-tight text-[var(--text)]">
                  Sites Under Watch
                </h2>
                <p className="text-[13px] text-[var(--text-muted)]">
                  Continuous synthetic monitoring and visual regression surveillance
                </p>
              </div>
              <Link
                href="/sites"
                className="text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgSites.map((site) => {
                const checkData = siteDataMap.get(site.id);
                return (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="group relative flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all duration-200 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {site.faviconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={site.faviconUrl}
                              alt=""
                              width={18}
                              height={18}
                              className="rounded-xs shrink-0"
                            />
                          ) : (
                            <Globe className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-medium text-[var(--text)] group-hover:text-white truncate transition-colors">
                              {site.name}
                            </h3>
                            <p className="mono text-[11px] text-[var(--text-muted)] truncate">
                              {site.url}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={site.status} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5 mono">
                        <Clock className="h-3.5 w-3.5 text-[var(--text-faint)]" />
                        <span>
                          {checkData?.lastCheckedAt
                            ? new Date(checkData.lastCheckedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                        {checkData?.lastDurationMs != null && (
                          <span>· {checkData.lastDurationMs}ms</span>
                        )}
                      </div>

                      {checkData?.openIncidents ? (
                        <span className="text-[var(--critical)] text-[11px] font-medium">
                          {checkData.openIncidents} open
                        </span>
                      ) : (
                        <span className="text-[var(--healthy)] text-[11px]">
                          Stable
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ACTIVITY & INCIDENT LOG */}
          <div className="grid lg:grid-cols-2 gap-8 pt-4">
            {/* Recent Incidents */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                  Recent Incidents
                </h2>
                <Link
                  href="/incidents"
                  className="text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  View all
                </Link>
              </div>

              {recentIncidents.length === 0 ? (
                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/50 text-center text-[13px] text-[var(--text-muted)]">
                  <ShieldCheck className="h-6 w-6 text-[var(--healthy)] mx-auto mb-2 opacity-80" />
                  No incidents recorded. Witch is quietly watching.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentIncidents.map((incident) => (
                    <Link
                      key={incident.id}
                      href={`/incidents/${incident.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--text)] truncate">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                          <span>
                            {new Date(incident.lastDetectedAt).toLocaleDateString()}{" "}
                            {new Date(incident.lastDetectedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>·</span>
                          <span className="capitalize text-[var(--text-faint)]">
                            {incident.category}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={incident.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recoveries & Health timeline */}
            <section className="space-y-4">
              <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--healthy)]" />
                Recent Recoveries
              </h2>

              {recoveries.length === 0 ? (
                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/50 text-center text-[13px] text-[var(--text-muted)]">
                  No recoveries in recent history.
                </div>
              ) : (
                <div className="space-y-2">
                  {recoveries.map((incident) => (
                    <Link
                      key={incident.id}
                      href={`/incidents/${incident.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--text)] truncate">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-[var(--healthy)] flex items-center gap-1 mt-0.5">
                          <StatusDot status="RESOLVED" size="sm" />
                          <span>Recovered to baseline</span>
                        </div>
                      </div>
                      <span className="text-[11px] mono text-[var(--text-muted)] shrink-0">
                        {new Date(incident.lastDetectedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

