import Link from "next/link";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui";
import { computeSiteMetrics } from "@/features/reports/service";

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
  const recoveries = recentIncidents.filter((item) => item.status === "RESOLVED").slice(0, 5);
  const attention = orgSites.filter((site) => ["DOWN", "DEGRADED"].includes(site.status));
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
  if (orgSites[0]) {
    const metrics = await computeSiteMetrics(
      ctx.organizationId,
      orgSites[0].id,
      thirty,
      new Date(),
    );
    uptime = metrics.uptime;
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        description={
          attention.length === 0 && orgSites.length > 0
            ? `All systems look healthy. ${Number(recentChecks?.value ?? 0)} checks in the last 5 minutes.`
            : orgSites.length === 0
              ? "Nothing under watch yet."
              : `${attention.length} site${attention.length === 1 ? "" : "s"} need attention.`
        }
      />
      {orgSites.length === 0 ? (
        <p className="mb-8 text-[13px]">
          <Link href="/onboarding" className="prose-link">
            Add your first website
          </Link>
        </p>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-[13px] mb-10">
        <Stat label="Sites monitored" value={String(orgSites.length)} />
        <Stat label="Healthy" value={String(healthy)} />
        <Stat label="Issues" value={String(attention.length)} />
        <Stat label="Uptime 30d" value={`${uptime.toFixed(2)}%`} />
        <Stat label="Incidents this month" value={String(incidentCount?.value ?? 0)} />
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="text-[13px] text-[var(--text-muted)] mb-3">Recent incidents</h2>
          {recentIncidents.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">Nothing needs your attention.</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {recentIncidents.map((incident) => (
                <li key={incident.id} className="flex justify-between gap-3 border-b border-[var(--border)] py-2">
                  <Link href={`/incidents/${incident.id}`}>{incident.title}</Link>
                  <StatusBadge status={incident.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-[13px] text-[var(--text-muted)] mb-3">Sites needing attention</h2>
          {attention.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No sites in a degraded state.</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {attention.map((site) => (
                <li key={site.id} className="flex justify-between border-b border-[var(--border)] py-2">
                  <Link href={`/sites/${site.id}`}>{site.name}</Link>
                  <StatusBadge status={site.status} />
                </li>
              ))}
            </ul>
          )}
          <h2 className="text-[13px] text-[var(--text-muted)] mt-8 mb-3">Recent recoveries</h2>
          {recoveries.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No recoveries recorded this period.</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {recoveries.map((incident) => (
                <li key={incident.id}>
                  <Link href={`/incidents/${incident.id}`}>{incident.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[var(--text-muted)] mb-1">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}
