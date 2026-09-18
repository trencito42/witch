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
import { StatusBadge, Button, Input, Label } from "@/components/ui";
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
  const snapshots = await db
    .select()
    .from(visualSnapshots)
    .where(and(eq(visualSnapshots.siteId, site.id), eq(visualSnapshots.organizationId, ctx.organizationId)))
    .orderBy(desc(visualSnapshots.createdAt))
    .limit(20);
  const diffs = await db
    .select()
    .from(visualDiffs)
    .where(and(eq(visualDiffs.siteId, site.id), eq(visualDiffs.organizationId, ctx.organizationId)))
    .orderBy(desc(visualDiffs.createdAt))
    .limit(5);

  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const metrics = await computeSiteMetrics(ctx.organizationId, site.id, thirty, new Date());
  const currentDesktop = snapshots.find((item) => item.viewport === "desktop");
  const currentMobile = snapshots.find((item) => item.viewport === "mobile");
  const baselineDesktop = snapshots.find((item) => item.viewport === "desktop" && item.isBaseline);
  const latestDiff = diffs[0];

  const tabs = ["overview", "monitoring", "visual", "incidents", "history", "settings"];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            {site.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.faviconUrl} alt="" width={16} height={16} />
            ) : null}
            <h1 className="text-xl">{site.name}</h1>
            <StatusBadge status={site.status} />
          </div>
          <p className="mono text-[12px] text-[var(--text-muted)] mt-1">{site.url}</p>
        </div>
        <div className="flex gap-2 no-print">
          <RunCheckButton siteId={site.id} />
          <form action={actionPauseSite.bind(null, site.id, !site.pausedAt)}>
            <Button variant="secondary">{site.pausedAt ? "Resume" : "Pause"}</Button>
          </form>
          <Link href={`/sites/${site.id}?tab=settings`} className="text-[13px] px-3 h-9 inline-flex items-center">
            Settings
          </Link>
        </div>
      </div>

      {onboarding && (
        <p className="mb-6 text-[14px] text-[var(--accent)]">
          {ctx.plan.browserMonitoring
            ? "Your site is now under watch. Witch is creating the first visual baseline."
            : "HTTP monitoring is active. Visual monitoring requires Freelancer or above."}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[13px] mb-8">
        <div>
          <div className="text-[var(--text-muted)]">30d uptime</div>
          <div className="text-lg">{metrics.uptime.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)]">Response</div>
          <div className="text-lg">{Math.round(metrics.averageResponseMs) || "—"} ms</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)]">Last successful check</div>
          <div>{site.lastHealthyAt ? site.lastHealthyAt.toISOString().replace("T", " ").slice(0, 16) : "—"}</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)]">Open incidents</div>
          <div className="text-lg">
            {siteIncidents.filter((item) => item.status === "OPEN").length}
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-[13px] border-b border-[var(--border)] mb-6">
        {tabs.map((item) => (
          <Link
            key={item}
            href={`/sites/${site.id}?tab=${item}`}
            className={`pb-2 capitalize ${tab === item ? "text-[var(--accent)] border-b border-[var(--accent)]" : "text-[var(--text-muted)]"}`}
          >
            {item}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-[13px] text-[var(--text-muted)] mb-3">Recent checks</h2>
            <ul className="text-[13px] space-y-1">
              {checks.slice(0, 12).map((check) => (
                <li key={check.id} className={check.success ? "text-[var(--text-faint)]" : "text-[var(--warning)]"}>
                  {check.createdAt.toISOString().slice(11, 16)}{" "}
                  {check.success ? "Healthy" : check.errorMessage ?? "Issue detected"}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentDesktop && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/media/snapshot/${currentDesktop.id}`}
                alt="Desktop screenshot"
                className="border border-[var(--border)]"
              />
            )}
            {currentMobile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/media/snapshot/${currentMobile.id}`}
                alt="Mobile screenshot"
                className="border border-[var(--border)]"
              />
            )}
          </div>
        </div>
      )}

      {tab === "monitoring" && (
        <div className="space-y-6">
          {siteMonitors.map((monitor) => (
            <form
              key={monitor.id}
              action={actionUpdateMonitor.bind(null, monitor.id)}
              className="flex flex-wrap items-end gap-3 border-b border-[var(--border)] pb-4"
            >
              <div className="min-w-40">
                <div className="text-[13px]">{monitor.name}</div>
                <div className="text-[12px] text-[var(--text-muted)]">{monitor.type}</div>
              </div>
              <label className="text-[13px] flex items-center gap-2">
                <input type="checkbox" name="enabled" defaultChecked={monitor.enabled} />
                Enabled
              </label>
              <select
                name="interval"
                defaultValue={
                  INTERVAL_OPTIONS.find((item) => item.seconds === monitor.intervalSeconds)?.key ?? "30m"
                }
                className="h-8 bg-transparent border border-[var(--border)] px-2 text-[13px]"
              >
                {INTERVAL_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="text-[12px] text-[var(--text-muted)]">
                Last {monitor.lastRunAt?.toISOString().slice(11, 16) ?? "—"} · next{" "}
                {monitor.nextRunAt.toISOString().slice(11, 16)}
              </div>
              <Button variant="secondary">Save</Button>
            </form>
          ))}
          <form action={actionAddElementMonitor.bind(null, site.id)} className="max-w-lg space-y-3">
            <h3 className="text-[13px]">Add element monitor</h3>
            <div>
              <Label>CSS selector</Label>
              <Input name="selector" placeholder="button.checkout" />
            </div>
            <div>
              <Label>Expected text</Label>
              <Input name="expectedText" placeholder="Checkout" />
            </div>
            <Button>Add element check</Button>
          </form>
        </div>
      )}

      {tab === "visual" && (
        <div className="space-y-6">
          {baselineDesktop && currentDesktop ? (
            <>
              <CompareSlider
                beforeSrc={`/api/media/snapshot/${baselineDesktop.id}`}
                afterSrc={`/api/media/snapshot/${currentDesktop.id}`}
              />
              {latestDiff && (
                <p className="text-[13px] text-[var(--text-muted)]">
                  {(Number(latestDiff.differenceRatio) * 100).toFixed(2)}% pixels changed
                  {latestDiff.aboveThreshold ? " · above threshold" : " · within noise threshold"}
                </p>
              )}
              {latestDiff?.diffStorageKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/diff/${latestDiff.id}`} alt="Visual diff" className="border border-[var(--border)]" />
              )}
              {currentDesktop && (
                <form action={actionAcceptBaseline.bind(null, currentDesktop.id, site.id)}>
                  <Button variant="secondary">Accept current as baseline</Button>
                </form>
              )}
            </>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)]">
              Baseline screenshots appear after the first successful browser check.
            </p>
          )}
        </div>
      )}

      {tab === "incidents" && (
        <ul className="text-[13px] divide-y divide-[var(--border)]">
          {siteIncidents.length === 0 && <li className="py-4">Nothing needs your attention.</li>}
          {siteIncidents.map((incident) => (
            <li key={incident.id} className="py-3 flex justify-between">
              <Link href={`/incidents/${incident.id}`}>{incident.title}</Link>
              <StatusBadge status={incident.status} />
            </li>
          ))}
        </ul>
      )}

      {tab === "history" && (
        <table className="w-full text-[13px]">
          <thead className="text-left text-[var(--text-muted)]">
            <tr>
              <th className="py-2 font-medium">Time</th>
              <th className="font-medium">Result</th>
              <th className="font-medium">Code</th>
              <th className="font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.id} className="border-t border-[var(--border)]">
                <td className="py-2">{check.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td>{check.success ? "Healthy" : check.errorCode}</td>
                <td className="mono">{check.statusCode ?? "—"}</td>
                <td>{check.durationMs ?? "—"} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "settings" && (
        <div className="max-w-lg space-y-8">
          <form action={actionUpdateSite.bind(null, site.id)} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input name="name" defaultValue={site.name} />
            </div>
            <div>
              <Label>Visual sensitivity</Label>
              <select
                name="visualSensitivity"
                defaultValue={site.visualSensitivity}
                className="h-8 w-full bg-transparent border border-[var(--border)] px-2 text-[13px]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="statusPageVisible" defaultChecked={site.statusPageVisible} />
              Show on public status page
            </label>
            <p className="text-[12px] text-[var(--text-muted)]">URL changes are not allowed after creation to protect SSRF controls. Add a new site instead.</p>
            <Button>Save</Button>
          </form>
          <DeleteSiteButton siteId={site.id} />
        </div>
      )}
    </div>
  );
}
