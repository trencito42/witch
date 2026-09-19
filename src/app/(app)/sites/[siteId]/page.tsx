import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  incidents,
  monitorChecks,
  monitors,
  visualDiffs,
  visualSnapshots,
  type VisualNoiseSettings,
} from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { getSiteForOrg } from "@/features/sites/service";
import {
  StatusBadge,
  StatusDot,
  Button,
  Input,
  Label,
  Select,
  SwitchRow,
  Tabs,
  MetricCard,
  EmptyState,
} from "@/components/ui";
import { RunCheckButton } from "@/components/run-check-button";
import { CompareSlider } from "@/components/compare-slider";
import { SiteMonitorRow } from "@/components/site-monitor-row";
import { AddAssertionForm } from "@/components/add-assertion-form";
import {
  actionAcceptBaseline,
  actionAddElementMonitor,
  actionPauseSite,
  actionUpdateMonitor,
  actionUpdateSite,
} from "@/app/actions";
import { DeleteSiteButton } from "@/components/delete-site-button";
import { computeSiteMetrics } from "@/features/reports/service";
import { INTERVAL_OPTIONS } from "@/lib/constants";
import {
  Globe,
  ExternalLink,
  Pause,
  Play,
  Clock,
  Activity,
  ShieldAlert,
  Settings as SettingsIcon,
  Eye,
  Sliders,
  Sparkles,
  Laptop,
  Smartphone,
  AlertTriangle,
} from "lucide-react";

function LatencySparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 80;
  const height = 22;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 6) + 3;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex items-center gap-2 mt-2" title={`Recent latency range: ${min}ms - ${max}ms`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[11px] text-[var(--text-faint)] tabular-nums">
        {values[values.length - 1]}ms
      </span>
    </div>
  );
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ tab?: string; onboarding?: string; viewport?: string }>;
}) {
  const ctx = await requireOrgContext();
  const { siteId } = await params;
  const { tab = "overview", onboarding, viewport: activeViewportParam } = await searchParams;
  const activeViewport = activeViewportParam === "mobile" ? "mobile" : "desktop";
  const site = await getSiteForOrg(ctx.organizationId, siteId);
  if (!site) notFound();

  const siteMonitors = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.siteId, site.id), eq(monitors.organizationId, ctx.organizationId)));

  const checks = await db
    .select()
    .from(monitorChecks)
    .where(and(eq(monitorChecks.siteId, site.id), eq(monitorChecks.organizationId, ctx.organizationId)))
    .orderBy(desc(monitorChecks.createdAt))
    .limit(40);

  const siteIncidents = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.siteId, site.id), eq(incidents.organizationId, ctx.organizationId)))
    .orderBy(desc(incidents.lastDetectedAt))
    .limit(20);

  const [baselineDesktop] = await db
    .select()
    .from(visualSnapshots)
    .where(
      and(
        eq(visualSnapshots.siteId, site.id),
        eq(visualSnapshots.organizationId, ctx.organizationId),
        eq(visualSnapshots.viewport, "desktop"),
        eq(visualSnapshots.isBaseline, true),
      ),
    )
    .orderBy(desc(visualSnapshots.createdAt))
    .limit(1);

  const [currentDesktop] = await db
    .select()
    .from(visualSnapshots)
    .where(
      and(
        eq(visualSnapshots.siteId, site.id),
        eq(visualSnapshots.organizationId, ctx.organizationId),
        eq(visualSnapshots.viewport, "desktop"),
      ),
    )
    .orderBy(desc(visualSnapshots.createdAt))
    .limit(1);

  const [baselineMobile] = await db
    .select()
    .from(visualSnapshots)
    .where(
      and(
        eq(visualSnapshots.siteId, site.id),
        eq(visualSnapshots.organizationId, ctx.organizationId),
        eq(visualSnapshots.viewport, "mobile"),
        eq(visualSnapshots.isBaseline, true),
      ),
    )
    .orderBy(desc(visualSnapshots.createdAt))
    .limit(1);

  const [currentMobile] = await db
    .select()
    .from(visualSnapshots)
    .where(
      and(
        eq(visualSnapshots.siteId, site.id),
        eq(visualSnapshots.organizationId, ctx.organizationId),
        eq(visualSnapshots.viewport, "mobile"),
      ),
    )
    .orderBy(desc(visualSnapshots.createdAt))
    .limit(1);

  const [latestDesktopDiffRow] = currentDesktop
    ? await db
        .select()
        .from(visualDiffs)
        .where(
          and(
            eq(visualDiffs.siteId, site.id),
            eq(visualDiffs.organizationId, ctx.organizationId),
            eq(visualDiffs.currentSnapshotId, currentDesktop.id),
          ),
        )
        .orderBy(desc(visualDiffs.createdAt))
        .limit(1)
    : [];
  const latestDesktopDiff = latestDesktopDiffRow ?? null;

  const [latestMobileDiffRow] = currentMobile
    ? await db
        .select()
        .from(visualDiffs)
        .where(
          and(
            eq(visualDiffs.siteId, site.id),
            eq(visualDiffs.organizationId, ctx.organizationId),
            eq(visualDiffs.currentSnapshotId, currentMobile.id),
          ),
        )
        .orderBy(desc(visualDiffs.createdAt))
        .limit(1)
    : [];
  const latestMobileDiff = latestMobileDiffRow ?? null;

  const activeBaseline = activeViewport === "desktop" ? baselineDesktop : baselineMobile;
  const activeCurrent = activeViewport === "desktop" ? currentDesktop : currentMobile;
  const activeDiff = activeViewport === "desktop" ? latestDesktopDiff : latestMobileDiff;

  const dimensionMismatch = Boolean(
    activeBaseline &&
      activeCurrent &&
      (activeBaseline.viewport !== activeCurrent.viewport ||
        activeBaseline.width !== activeCurrent.width ||
        activeBaseline.height !== activeCurrent.height),
  );

  const noiseSettings = (site.visualNoiseSettings as VisualNoiseSettings) ?? {};

  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const metrics = await computeSiteMetrics(ctx.organizationId, site.id, thirty, new Date());

  const openIncidentsCount = siteIncidents.filter((item) =>
    ["OPEN", "ACKNOWLEDGED"].includes(item.status),
  ).length;

  const tabItems = [
    { id: "overview", label: "Overview", icon: <Activity className="h-3.5 w-3.5" />, href: `/sites/${site.id}?tab=overview` },
    { id: "visual", label: "Visual Baselines", icon: <Eye className="h-3.5 w-3.5" />, href: `/sites/${site.id}?tab=visual` },
    { id: "monitoring", label: "Surveillance", icon: <Sliders className="h-3.5 w-3.5" />, count: siteMonitors.length, href: `/sites/${site.id}?tab=monitoring` },
    { id: "incidents", label: "Incidents", icon: <ShieldAlert className="h-3.5 w-3.5" />, count: openIncidentsCount, href: `/sites/${site.id}?tab=incidents` },
    { id: "history", label: "Check Log", icon: <Clock className="h-3.5 w-3.5" />, href: `/sites/${site.id}?tab=history` },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="h-3.5 w-3.5" />, href: `/sites/${site.id}?tab=settings` },
  ];

  const recentLatencies = checks
    .filter((c) => c.durationMs !== null && (c.durationMs as number) > 0)
    .slice(0, 10)
    .map((c) => c.durationMs as number)
    .reverse();

  return (
    <div className="space-y-8">
      {/* SITE HEADER (Sticky & compact on mobile) */}
      <div className="sticky top-14 md:top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {site.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.faviconUrl}
                alt=""
                width={24}
                height={24}
                className="rounded-md shrink-0"
              />
            ) : (
              <Globe className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
            )}
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[var(--text)] truncate app-heading">
              {site.name}
            </h1>
            <StatusBadge status={site.status} />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              title={site.url}
              className="font-mono text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1.5 transition-colors min-w-0 max-w-full"
            >
              <span className="truncate">{site.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 no-print self-end sm:self-auto">
          <RunCheckButton siteId={site.id} compactOnMobile />

          <form action={actionPauseSite.bind(null, site.id, !site.pausedAt)} className="w-auto">
            <Button
              type="submit"
              variant="secondary"
              aria-label={site.pausedAt ? "Resume watch" : "Pause"}
              className="touch-target"
            >
              {site.pausedAt ? (
                <Play className="h-4 w-4 text-[var(--healthy)]" />
              ) : (
                <Pause className="h-4 w-4 text-[var(--warning)]" />
              )}
              <span className="hidden sm:inline">
                {site.pausedAt ? "Resume watch" : "Pause"}
              </span>
            </Button>
          </form>
        </div>
      </div>

      {onboarding && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[13px] text-[var(--text)]">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>
            {ctx.plan.browserMonitoring
              ? "This site is queued for HTTP checks and Chromium baseline captures."
              : "HTTP checks are queued. Upgrade to Freelancer or above for visual regression testing."}
          </span>
        </div>
      )}

      {/* HEALTH METRICS OVERVIEW (2x2 on mobile, 4 in a row from 768px) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="HTTP Uptime (30d)"
          value={`${metrics.uptime.toFixed(2)}%`}
          indicator="healthy"
          secondary={`${metrics.checks} synthetic pings`}
        />
        <MetricCard
          label="Avg Latency"
          value={Math.round(metrics.averageResponseMs) ? `${Math.round(metrics.averageResponseMs)} ms` : "—"}
          indicator="neutral"
          secondary="Origin server latency"
          extra={<LatencySparkline values={recentLatencies} />}
        />
        <MetricCard
          label="Browser Validation"
          value={
            site.lastHealthyAt
              ? "Healthy"
              : "Pending"
          }
          indicator={site.lastHealthyAt ? "healthy" : "neutral"}
          secondary={
            site.lastHealthyAt
              ? `Checked ${new Date(site.lastHealthyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ctx.plan.browserMonitoring
                ? "Chromium DOM & visual check"
                : "HTTP synthetic only"
          }
        />
        <MetricCard
          label="Active Incidents"
          value={openIncidentsCount}
          indicator={openIncidentsCount > 0 ? "critical" : "neutral"}
          secondary={openIncidentsCount > 0 ? "Visual or script failure" : "All monitors nominal"}
        />
      </div>

      {/* MOBILE / TABLET RIGHT RAIL (Stacks under stats below 1024px) */}
      <div className="lg:hidden">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Live Status
              </span>
              <StatusBadge status={site.status} />
            </div>
            <div className="text-[12px] space-y-1 text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Desktop (1440px):</span>
                <span className="text-[var(--text)] font-medium">
                  {baselineDesktop ? `${baselineDesktop.width}×${baselineDesktop.height}` : "Pending baseline"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mobile (390px):</span>
                <span className="text-[var(--text)] font-medium">
                  {baselineMobile ? `${baselineMobile.width}×${baselineMobile.height}` : "Pending baseline"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Active Incidents
              </span>
              <span className="text-[12px] font-semibold text-[var(--text)]">{openIncidentsCount}</span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              {openIncidentsCount > 0
                ? "One or more monitors detected an issue."
                : "All checks nominal. Zero regressions recorded."}
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT (At 1024px and up: Main tabs + 320px Right Rail) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* MAIN TABS & MONITORS COLUMN */}
        <div className="min-w-0 space-y-6">
          <Tabs items={tabItems} activeId={tab} />

      {/* TAB 1: OVERVIEW */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              Latest Telemetry Feeds
            </h2>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {checks.slice(0, 10).map((check) => (
                <div key={check.id} className="p-3 flex items-center justify-between gap-3 text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot
                      status={check.success ? "HEALTHY" : "DOWN"}
                      size="sm"
                    />
                    <span className="mono text-[var(--text-muted)] shrink-0">
                      {new Date(check.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="truncate text-[var(--text)]">
                      {check.success ? "Operational check passed" : check.errorMessage ?? "Check failure"}
                    </span>
                  </div>
                  <span className="mono text-[var(--text-muted)] shrink-0">
                    {check.durationMs ? `${check.durationMs}ms` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
              <Eye className="h-4 w-4 text-[var(--accent)]" />
              Latest Visual Telemetry
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <span>Desktop Chromium (1440px)</span>
                  {currentDesktop && <span className="mono">{new Date(currentDesktop.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-black overflow-hidden aspect-video relative group">
                  {currentDesktop ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/snapshot/${currentDesktop.id}`}
                      alt="Desktop snapshot"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full px-4 text-center text-[12px] text-[var(--text-faint)]">
                      {ctx.plan.browserMonitoring
                        ? "Snapshot pending"
                        : "Visual snapshots require Freelancer or above"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <span>Mobile Chromium (390px)</span>
                  {currentMobile && <span className="mono">{new Date(currentMobile.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-black overflow-hidden aspect-video relative group">
                  {currentMobile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/snapshot/${currentMobile.id}`}
                      alt="Mobile snapshot"
                      className="w-full h-full object-contain object-top"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full px-4 text-center text-[12px] text-[var(--text-faint)]">
                      {ctx.plan.browserMonitoring
                        ? "Snapshot pending"
                        : "Visual snapshots require Freelancer or above"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL */}
      {tab === "visual" && (
        <div className="space-y-6">
          {/* VIEWPORT SELECTOR: DESKTOP vs MOBILE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div>
              <h3 className="text-[14px] font-medium text-[var(--text)]">
                Visual Baseline Comparison
              </h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Interactive split-view between accepted baseline and latest captured frame.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] self-start sm:self-auto">
              <Link
                href={`/sites/${site.id}?tab=visual&viewport=desktop`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                  activeViewport === "desktop"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Desktop (1440px)</span>
              </Link>
              <Link
                href={`/sites/${site.id}?tab=visual&viewport=mobile`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                  activeViewport === "mobile"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile (390px)</span>
              </Link>
            </div>
          </div>

          {activeBaseline && activeCurrent ? (
            <div className="space-y-6">
              {/* VIEWPORT DIMENSION INTEGRITY CHECK */}
              {dimensionMismatch ? (
                <div className="p-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-dim)] text-[13px] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[var(--text)]">
                        Baseline viewport differs from the current capture
                      </h4>
                      <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        The baseline was recorded under a different resolution or configuration. Split comparison is suspended to avoid false visual scaling.
                      </p>
                      <div className="mt-2 text-[12px] font-mono flex items-center gap-4 text-[var(--text)]">
                        <span>Baseline: {activeBaseline.width} × {activeBaseline.height} ({activeBaseline.viewport})</span>
                        <span>Current: {activeCurrent.width} × {activeCurrent.height} ({activeCurrent.viewport})</span>
                      </div>
                    </div>
                  </div>
                  <form action={actionAcceptBaseline.bind(null, activeCurrent.id, site.id)}>
                    <Button variant="primary" size="sm">
                      Set current as new baseline
                    </Button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 text-[12px]">
                    <div className="flex items-center gap-3 flex-wrap">
                      {activeDiff ? (
                        <span className="mono text-[var(--text)]">
                          {(Number(activeDiff.differenceRatio) * 100).toFixed(2)}% pixel diff
                          {activeDiff.aboveThreshold ? (
                            <span className="ml-1 text-[var(--warning)] font-bold">· Above threshold</span>
                          ) : (
                            <span className="ml-1 text-[var(--healthy)] font-medium">· Nominal</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">No diff recorded</span>
                      )}
                    </div>

                    <form action={actionAcceptBaseline.bind(null, activeCurrent.id, site.id)}>
                      <Button variant="primary" size="sm" className="w-full sm:w-auto">
                        Accept current as baseline
                      </Button>
                    </form>
                  </div>

                  {/* COMPARATOR */}
                  <div
                    className={
                      activeViewport === "mobile"
                        ? "max-w-[400px] mx-auto w-full transition-all"
                        : "w-full"
                    }
                  >
                    <CompareSlider
                      beforeSrc={`/api/media/snapshot/${activeBaseline.id}`}
                      afterSrc={`/api/media/snapshot/${activeCurrent.id}`}
                    />
                  </div>

                  {/* METADATA BAR BELOW COMPARATOR */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] space-y-1">
                      <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] font-medium">
                        Baseline ({activeBaseline.viewport})
                      </div>
                      <div className="text-[var(--text)] font-medium">
                        {activeBaseline.width} × {activeBaseline.height} px
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Accepted {new Date(activeBaseline.createdAt).toLocaleDateString()} {new Date(activeBaseline.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] space-y-1">
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                        Current ({activeCurrent.viewport})
                      </div>
                      <div className="text-[var(--text)] font-medium">
                        {activeCurrent.width} × {activeCurrent.height} px
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Captured {new Date(activeCurrent.createdAt).toLocaleDateString()} {new Date(activeCurrent.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  {/* HEATMAP */}
                  {activeDiff?.diffStorageKey && (
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                      <h4 className="text-[13px] font-medium text-[var(--text-muted)]">
                        Differential Heatmap (Pixel Diff · {activeViewport})
                      </h4>
                      <div className="rounded-xl border border-[var(--border)] bg-black overflow-hidden max-w-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/media/diff/${activeDiff.id}`}
                          alt={`Visual diff heatmap ${activeViewport}`}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <EmptyState
              title={
                ctx.plan.browserMonitoring
                  ? `Visual ${activeViewport} baseline pending`
                  : "Visual monitoring is not on Free"
              }
              description={
                ctx.plan.browserMonitoring
                  ? `Visual regression baselines for ${activeViewport} appear automatically after the first successful Chromium browser check completes.`
                  : "Free runs HTTP and TLS checks only. Upgrade to Freelancer or above to capture desktop and mobile Chromium snapshots."
              }
              action={
                ctx.plan.browserMonitoring ? (
                  <RunCheckButton siteId={site.id} />
                ) : (
                  <Link href="/settings?tab=billing">
                    <Button variant="primary">View plans</Button>
                  </Link>
                )
              }
            />
          )}
        </div>
      )}

      {/* TAB 3: MONITORING */}
      {tab === "monitoring" && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-[16px] font-semibold text-[var(--text)]">
              Active Monitors
            </h2>

            <div className="space-y-3">
              {siteMonitors.map((monitor) => (
                <SiteMonitorRow
                  key={monitor.id}
                  monitor={monitor}
                  intervalOptions={INTERVAL_OPTIONS}
                  action={actionUpdateMonitor.bind(null, monitor.id)}
                />
              ))}
            </div>
          </div>

          {/* ADD ELEMENT MONITOR */}
          <AddAssertionForm
            siteId={site.id}
            action={actionAddElementMonitor.bind(null, site.id)}
            enabled={Boolean(ctx.plan.browserMonitoring)}
          />
        </div>
      )}

      {/* TAB 4: INCIDENTS */}
      {tab === "incidents" && (
        <div className="space-y-4">
          {siteIncidents.length === 0 ? (
            <EmptyState
              title="No incidents detected"
              description="All synthetic and visual checks for this service are healthy and within established thresholds."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {siteIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[var(--text)]">
                        {incident.title}
                      </span>
                      <StatusBadge status={incident.severity} />
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] flex items-center gap-2">
                      <span>
                        {new Date(incident.firstDetectedAt).toLocaleDateString()}{" "}
                        {new Date(incident.firstDetectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{incident.category}</span>
                    </div>
                  </div>

                  <StatusBadge status={incident.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HISTORY */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xs">
            <div className="overflow-x-auto no-scrollbar max-w-full">
            <table className="w-full min-w-[540px] text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/60 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">HTTP Status</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {checks.map((check) => (
                  <tr key={check.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-4 mono text-[12px] text-[var(--text-muted)]">
                      {new Date(check.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={check.success ? "HEALTHY" : "DOWN"} size="sm" />
                        <span>{check.success ? "Healthy" : check.errorCode ?? "Failed"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 mono text-[12px]">
                      {check.statusCode ?? "—"}
                    </td>
                    <td className="py-3 px-4 mono text-[12px] text-[var(--text-muted)]">
                      {check.durationMs != null ? `${check.durationMs}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile History Cards */}
          <div className="md:hidden space-y-2">
            {checks.map((check) => (
              <div key={check.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <StatusDot status={check.success ? "HEALTHY" : "DOWN"} size="sm" />
                  <span className="mono text-[var(--text-muted)]">
                    {new Date(check.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>{check.success ? "Healthy" : check.errorCode ?? "Failed"}</span>
                </div>
                <span className="mono text-[var(--text-muted)]">
                  {check.durationMs ? `${check.durationMs}ms` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {tab === "settings" && (
        <div className="space-y-8 max-w-xl">
          <form action={actionUpdateSite.bind(null, site.id)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[14px] font-medium text-[var(--text)]">Site Details</h3>
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" name="name" defaultValue={site.name} required />
              </div>

              <div>
                <Label htmlFor="sensitivity">Visual Diff Sensitivity</Label>
                <Select
                  id="sensitivity"
                  name="visualSensitivity"
                  defaultValue={site.visualSensitivity}
                >
                  <option value="LOW">Low (tolerates minor font and pixel shifts)</option>
                  <option value="MEDIUM">Medium (recommended default)</option>
                  <option value="HIGH">High (alerts on subtle styling changes)</option>
                </Select>
              </div>

              <SwitchRow
                title="Show on public status page"
                description="Make this website and its operational health visible on your organization's public status portal."
                name="statusPageVisible"
                defaultChecked={site.statusPageVisible}
              />
            </div>

            {/* VISUAL CAPTURE SETTINGS */}
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--text)]">Visual Capture</h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Configure browser emulation characteristics for screenshot baselines.
                </p>
              </div>

              <div>
                <Label htmlFor="colorScheme">Emulated Color Scheme</Label>
                <Select
                  id="colorScheme"
                  name="colorScheme"
                  defaultValue={noiseSettings.colorScheme ?? "light"}
                >
                  <option value="light">Light (default)</option>
                  <option value="dark">Dark</option>
                  <option value="default">System / Page Default</option>
                </Select>
              </div>
            </div>

            {/* VISUAL NOISE SETTINGS */}
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--text)]">Visual Noise</h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Exclude dynamic overlays and widgets from triggering visual regression incidents.
                </p>
              </div>

              <div className="space-y-3">
                <SwitchRow
                  title="Ignore cookie consent banners"
                  description="Dynamic CMP banners (OneTrust, Cookiebot, etc.) won't trigger visual incidents."
                  name="ignoreCookieConsent"
                  defaultChecked={noiseSettings.ignoreCookieConsent !== false}
                />

                <SwitchRow
                  title="Ignore chat widgets"
                  description="Floating support widgets (Intercom, Crisp, Drift, etc.) are excluded from pixel comparison."
                  name="ignoreChatWidgets"
                  defaultChecked={noiseSettings.ignoreChatWidgets !== false}
                />

                <SwitchRow
                  title="Ignore marketing popups"
                  description="Newsletter and promotional overlays are excluded when confidently detected."
                  name="ignoreMarketingPopups"
                  defaultChecked={noiseSettings.ignoreMarketingPopups === true}
                />

                <SwitchRow
                  title="Ignore ad containers"
                  description="Dynamic ad slots and banners are excluded from visual difference calculations."
                  name="ignoreAds"
                  defaultChecked={noiseSettings.ignoreAds === true}
                />

                <SwitchRow
                  title="Ignore sticky promotional banners"
                  description="Fixed top and bottom announcement bars are excluded from comparison."
                  name="ignoreStickyPromos"
                  defaultChecked={noiseSettings.ignoreStickyPromos === true}
                />

                <SwitchRow
                  title="Clean capture mode"
                  description="Hide selected nuisance overlays before screenshots instead of only excluding them from visual comparison. This changes the captured presentation but does not change the live website."
                  name="cleanCapture"
                  defaultChecked={noiseSettings.cleanCapture === true}
                />

                <SwitchRow
                  title="Auto-dismiss consent dialogs"
                  description="Attempt to automatically click Reject or Essential Only on detected cookie banners before capture."
                  name="autoDismissConsent"
                  defaultChecked={noiseSettings.autoDismissConsent === true}
                />
              </div>

              {/* ADVANCED: CUSTOM SELECTORS */}
              <div className="pt-3">
                <Label htmlFor="ignoreSelectors">Custom Ignore Selectors</Label>
                <textarea
                  id="ignoreSelectors"
                  name="ignoreSelectors"
                  rows={3}
                  defaultValue={Array.isArray(site.ignoreSelectors) ? (site.ignoreSelectors as string[]).join("\n") : ""}
                  placeholder={`.intercom-lightweight-app\n#newsletter-popup\n.promo-ticker`}
                  className="w-full mt-1.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[12px] font-mono text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  One CSS selector per line. Matching regions are excluded from visual difference calculations.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[12px] text-[var(--text-muted)] leading-relaxed">
              Target URL modifications are restricted after creation to ensure rigorous SSRF safety controls. To monitor a different domain, add a new service.
            </div>

            <Button type="submit" variant="primary">
              Save configuration
            </Button>
          </form>

          {/* DANGER ZONE */}
          <div className="pt-6 border-t border-[rgba(248,113,113,0.2)] space-y-3">
            <h3 className="text-[14px] font-medium text-[var(--critical)]">
              Danger Zone
            </h3>
            <p className="text-[12px] text-[var(--text-muted)]">
              Deleting this site will purge all historical uptime checks, screenshots, and visual regression records.
            </p>
            <DeleteSiteButton siteId={site.id} />
          </div>
        </div>
      )}
        </div>

        {/* DESKTOP RIGHT RAIL (320px on screens >= 1024px) */}
        <aside className="hidden lg:block w-[320px] shrink-0 space-y-4">
          {/* Live Health & Baseline Status Card */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Live Status
              </span>
              <StatusBadge status={site.status} />
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[11px] text-[var(--text-faint)] uppercase tracking-wider block">
                  Monitored Target
                </span>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  title={site.url}
                  className="font-mono text-[12px] text-[var(--text)] hover:text-[var(--accent)] truncate block mt-0.5"
                >
                  {site.url}
                </a>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-muted)]">Desktop (1440px)</span>
                  <span className="text-[12px] font-medium text-[var(--text)]">
                    {baselineDesktop ? `${baselineDesktop.width}×${baselineDesktop.height}` : "Pending baseline"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-muted)]">Mobile (390px)</span>
                  <span className="text-[12px] font-medium text-[var(--text)]">
                    {baselineMobile ? `${baselineMobile.width}×${baselineMobile.height}` : "Pending baseline"}
                  </span>
                </div>
              </div>

              {site.lastCheckedAt && (
                <div className="pt-2 border-t border-[var(--border)] flex justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">Last Verified</span>
                  <span className="text-[var(--text)] tabular-nums" title={new Date(site.lastCheckedAt).toLocaleString()}>
                    {new Date(site.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Incident Summary Card */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Incident Summary
              </span>
              <span className="text-[12px] tabular-nums font-semibold text-[var(--text)]">
                {openIncidentsCount} active
              </span>
            </div>

            {siteIncidents.length > 0 ? (
              <div className="space-y-2">
                {siteIncidents.slice(0, 2).map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/incidents/${inc.id}`}
                    className="block p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors text-[12px]"
                  >
                    <div className="font-medium text-[var(--text)] truncate">{inc.title}</div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-muted)]">
                      <span>{new Date(inc.firstDetectedAt).toLocaleDateString()}</span>
                      <span className="capitalize">{inc.severity}</span>
                    </div>
                  </Link>
                ))}
                <Link
                  href={`/sites/${site.id}?tab=incidents`}
                  className="block text-center text-[12px] text-[var(--accent)] hover:underline pt-1 font-medium"
                >
                  View incidents tab →
                </Link>
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                All synthetic and visual checks are nominal. Zero regressions recorded.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

