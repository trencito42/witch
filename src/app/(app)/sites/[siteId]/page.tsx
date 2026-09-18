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
} from "lucide-react";

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ tab?: string; onboarding?: string }>;
}) {
  const ctx = await requireOrgContext();
  const { siteId } = await params;
  const { tab = "overview", onboarding } = await searchParams;
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
  const [latestDiff] = await db
    .select({ diff: visualDiffs })
    .from(visualDiffs)
    .innerJoin(visualSnapshots, eq(visualSnapshots.id, visualDiffs.currentSnapshotId))
    .where(
      and(
        eq(visualDiffs.siteId, site.id),
        eq(visualDiffs.organizationId, ctx.organizationId),
        eq(visualSnapshots.viewport, "desktop"),
      ),
    )
    .orderBy(desc(visualDiffs.createdAt))
    .limit(1);

  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const metrics = await computeSiteMetrics(ctx.organizationId, site.id, thirty, new Date());
  const latestDesktopDiff = latestDiff?.diff;

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

  return (
    <div className="space-y-8 animate-spectral-fade">
      {/* SITE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            {site.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.faviconUrl}
                alt=""
                width={22}
                height={22}
                className="rounded-xs shrink-0 mt-1"
              />
            ) : (
              <Globe className="h-5 w-5 text-[var(--text-muted)] shrink-0 mt-1" />
            )}
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)] break-words">
                {site.name}
              </h1>
              <StatusBadge status={site.status} />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="mono text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1.5 transition-colors min-w-0 max-w-full"
            >
              <span className="truncate">{site.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2.5 shrink-0 no-print [&_button]:w-full sm:[&_button]:w-auto">
          <RunCheckButton siteId={site.id} />

          <form action={actionPauseSite.bind(null, site.id, !site.pausedAt)} className="w-full sm:w-auto">
            <Button
              type="submit"
              variant="secondary"
              leadingIcon={
                site.pausedAt ? (
                  <Play className="h-3.5 w-3.5 text-[var(--healthy)]" />
                ) : (
                  <Pause className="h-3.5 w-3.5 text-[var(--warning)]" />
                )
              }
            >
              {site.pausedAt ? "Resume watch" : "Pause"}
            </Button>
          </form>
        </div>
      </div>

      {onboarding && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(187,242,176,0.3)] bg-[var(--accent-dim)] text-[13px] text-[var(--accent-strong)]">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>
            {ctx.plan.browserMonitoring
              ? "Your website is now under active surveillance. Witch has queued synthetic HTTP checks and browser baseline captures."
              : "HTTP synthetic surveillance is active. Upgrade to Freelancer or above to enable visual regression testing."}
          </span>
        </div>
      )}

      {/* HEALTH METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="30d Uptime"
          value={`${metrics.uptime.toFixed(2)}%`}
          indicator="healthy"
          secondary={`${metrics.checks} checks`}
        />
        <MetricCard
          label="Avg Latency"
          value={Math.round(metrics.averageResponseMs) ? `${Math.round(metrics.averageResponseMs)} ms` : "—"}
          indicator="neutral"
          secondary="Synthetic HTTP"
        />
        <MetricCard
          label="Last Healthy Check"
          value={
            site.lastHealthyAt
              ? new Date(site.lastHealthyAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
          indicator={site.lastHealthyAt ? "healthy" : "neutral"}
          secondary={site.lastHealthyAt ? new Date(site.lastHealthyAt).toLocaleDateString() : undefined}
        />
        <MetricCard
          label="Active Incidents"
          value={openIncidentsCount}
          indicator={openIncidentsCount > 0 ? "critical" : "neutral"}
          secondary={openIncidentsCount > 0 ? "Investigation required" : "Clean state"}
        />
      </div>

      {/* TAB NAVIGATION */}
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
                    <div className="flex items-center justify-center h-full text-[12px] text-[var(--text-faint)]">
                      Snapshot pending
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
                    <div className="flex items-center justify-center h-full text-[12px] text-[var(--text-faint)]">
                      Snapshot pending
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
          {baselineDesktop && currentDesktop ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--text)]">
                    Visual Baseline Comparison
                  </h3>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Interactive split-view between accepted baseline and latest captured Chromium frame.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                  {latestDesktopDiff && (
                    <span className="px-2.5 py-1 rounded-md text-[12px] mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]">
                      {(Number(latestDesktopDiff.differenceRatio) * 100).toFixed(2)}% pixel diff
                      {latestDesktopDiff.aboveThreshold ? (
                        <span className="ml-1 text-[var(--warning)] font-bold">· Above threshold</span>
                      ) : (
                        <span className="ml-1 text-[var(--healthy)]">· Nominal</span>
                      )}
                    </span>
                  )}
                  <form action={actionAcceptBaseline.bind(null, currentDesktop.id, site.id)}>
                    <Button variant="primary" size="sm">
                      Accept current as baseline
                    </Button>
                  </form>
                </div>
              </div>

              <CompareSlider
                beforeSrc={`/api/media/snapshot/${baselineDesktop.id}`}
                afterSrc={`/api/media/snapshot/${currentDesktop.id}`}
              />

              {latestDesktopDiff?.diffStorageKey && (
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <h4 className="text-[13px] font-medium text-[var(--text-muted)]">
                    Differential Heatmap (Pixel Diff)
                  </h4>
                  <div className="rounded-xl border border-[var(--border)] bg-black overflow-hidden max-w-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/diff/${latestDesktopDiff.id}`}
                      alt="Visual diff heatmap"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Visual baselines pending"
              description="Visual regression baselines appear automatically after the first successful Chromium browser check completes."
              action={<RunCheckButton siteId={site.id} />}
            />
          )}
        </div>
      )}

      {/* TAB 3: MONITORING */}
      {tab === "monitoring" && (
        <div className="space-y-8 max-w-3xl">
          <div className="space-y-4">
            <h2 className="text-[15px] font-medium text-[var(--text)]">
              Active Monitors
            </h2>

            <div className="space-y-3">
              {siteMonitors.map((monitor) => (
                <form
                  key={monitor.id}
                  action={actionUpdateMonitor.bind(null, monitor.id)}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[var(--text)]">
                        {monitor.name}
                      </span>
                      <span className="text-[11px] mono uppercase px-1.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                        {monitor.type}
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] mono">
                      Last: {monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Never"} · Next: {new Date(monitor.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={monitor.enabled}
                        className="accent-[var(--accent)]"
                      />
                      <span>Active</span>
                    </label>

                    <div className="w-full sm:w-32 min-w-0">
                      <Select
                        name="interval"
                        defaultValue={
                          INTERVAL_OPTIONS.find((item) => item.seconds === monitor.intervalSeconds)?.key ?? "30m"
                        }
                      >
                        {INTERVAL_OPTIONS.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          {/* ADD ELEMENT MONITOR */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
            <div>
              <h3 className="text-[14px] font-medium text-[var(--text)]">
                Add DOM Element Assertion
              </h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {ctx.plan.browserMonitoring
                  ? "Ensure crucial interactive elements (e.g. checkout buttons, forms, nav links) remain rendered and clickable."
                  : "Element monitors run inside Chromium and are available on Freelancer and above."}
              </p>
            </div>

            {ctx.plan.browserMonitoring ? (
              <form action={actionAddElementMonitor.bind(null, site.id)} className="space-y-4">
                <div>
                  <Label htmlFor="selector">CSS Selector</Label>
                  <Input
                    id="selector"
                    name="selector"
                    placeholder="button.checkout, #submit-order"
                    className="mono"
                  />
                </div>

                <div>
                  <Label htmlFor="expectedText">Expected Text (optional)</Label>
                  <Input
                    id="expectedText"
                    name="expectedText"
                    placeholder="Checkout, Order Now"
                  />
                </div>

                <Button type="submit" variant="secondary">
                  Add element check
                </Button>
              </form>
            ) : (
              <Button type="button" variant="secondary" disabled>
                Requires Freelancer
              </Button>
            )}
          </div>
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
          <form action={actionUpdateSite.bind(null, site.id)} className="space-y-5">
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
  );
}

