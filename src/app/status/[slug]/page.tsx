import { notFound } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { incidents, organizations, sites } from "@/db/schema";
import { StatusBadge, HealthBeacon, Badge } from "@/components/ui";
import { Wordmark } from "@/components/logo";
import { Globe, ShieldCheck, Clock } from "lucide-react";

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
  const beaconStatus = hasDown
    ? "critical"
    : hasDegraded
      ? "degraded"
      : allPaused
        ? "paused"
        : unknownOnly
          ? "warning"
          : "healthy";
  const overallLabel = hasDown
    ? "Major Service Disruption"
    : hasDegraded
      ? "Active Service Degradation"
      : allPaused
        ? "Monitoring Paused"
        : unknownOnly
          ? "Status Unknown"
          : "All Systems Operational";

  const visibleIds = orgSites.map((site) => site.id);
  const ninetyDays = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const history = visibleIds.length
    ? await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.organizationId, org.id),
            inArray(incidents.siteId, visibleIds),
            gte(incidents.firstDetectedAt, ninetyDays),
            inArray(incidents.status, ["OPEN", "ACKNOWLEDGED", "RESOLVED"]),
          ),
        )
        .orderBy(desc(incidents.firstDetectedAt))
        .limit(20)
    : [];
  const freshestCheck = orgSites
    .map((site) => site.lastCheckedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const fresh =
    freshestCheck && Date.now() - freshestCheck.getTime() < 2 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text)] flex flex-col selection:bg-[var(--accent)]/30">
      {/* Header */}
      <header className="border-b border-[var(--border)]/80 bg-[var(--surface-0)]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
              {org.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-medium text-[15px] tracking-tight text-[var(--text)]">
              {org.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Wordmark size="mobile" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 sm:px-8 py-10 sm:py-14 space-y-10">
        {/* Status Hero */}
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 p-6 sm:p-9 shadow-2xl backdrop-blur-md overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent ${
              beaconStatus === "healthy"
                ? "via-[var(--healthy)]/50"
                : beaconStatus === "degraded"
                  ? "via-[var(--warning)]/50"
                  : "via-[var(--critical)]/50"
            } to-transparent`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <HealthBeacon status={beaconStatus} size="lg" />
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
                  {overallLabel}
                </h1>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                  {org.statusPageHeadline || "Continuous automated checks across all core endpoints."}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border)]/60">
              <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-mono text-[var(--text-faint)]">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {fresh && freshestCheck
                    ? `Last check ${freshestCheck.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : freshestCheck
                      ? "Checks may be delayed"
                      : "No checks recorded yet"}
                </span>
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {orgSites.length} {orgSites.length === 1 ? "service" : "services"} under watch
              </div>
            </div>
          </div>
        </div>

        {/* Monitored Systems */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium tracking-tight text-[var(--text)]">
              Monitored Endpoints
            </h2>
            <span className="text-[12px] text-[var(--text-faint)] font-mono">
              Public status
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/50 overflow-hidden divide-y divide-[var(--border)]">
            {orgSites.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[var(--text-muted)]">
                No public services configured yet.
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

                return (
                  <div
                    key={site.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-[var(--surface-2)]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[var(--text)]">
                          {site.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                      <StatusBadge status={siteStatus} label={badgeLabel} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Incident History */}
        <section className="space-y-4 pt-4">
          <h2 className="text-[15px] font-medium tracking-tight text-[var(--text)]">
            Recent Incidents &amp; Maintenance
          </h2>

          {history.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--healthy)]/10 text-[var(--healthy)] mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-[14px] font-medium text-[var(--text)] mb-1">
                All systems quiet
              </div>
              <p className="text-[13px] text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                No public incidents in the past 90 days.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/50 divide-y divide-[var(--border)]">
              {history.map((incident) => (
                <div key={incident.id} className="p-4 sm:px-6 space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[14px] font-medium text-[var(--text)]">
                      {incident.title}
                    </div>
                    <Badge
                      variant={
                        incident.status === "RESOLVED"
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
                  <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                    <span className="font-mono">
                      {incident.firstDetectedAt.toISOString().slice(0, 10)}{" "}
                      {incident.firstDetectedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{incident.severity.toLowerCase()} impact</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]/80 py-8 text-center text-[12px] text-[var(--text-muted)]">
        <div className="flex items-center justify-center mb-1">
          <Wordmark />
        </div>
        <p className="text-[11px] text-[var(--text-faint)]">
          Quiet, automated website monitoring beyond uptime.
        </p>
      </footer>
    </div>
  );
}
