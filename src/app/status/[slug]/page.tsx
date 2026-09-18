import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { incidents, organizations, sites } from "@/db/schema";
import { StatusBadge } from "@/components/ui";
import { Wordmark } from "@/components/logo";

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
  const overall = orgSites.some((site) => site.status === "DOWN")
    ? "Outage"
    : orgSites.some((site) => site.status === "DEGRADED")
      ? "Degraded"
      : "Operational";
  const visibleIds = orgSites.map((site) => site.id);
  const history = visibleIds.length
    ? await db
        .select()
        .from(incidents)
        .where(and(eq(incidents.organizationId, org.id), inArray(incidents.siteId, visibleIds)))
        .orderBy(desc(incidents.firstDetectedAt))
        .limit(20)
    : [];

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Wordmark className="mb-10" />
      <h1 className="text-2xl mb-2">{org.statusPageHeadline || org.name}</h1>
      <StatusBadge status={overall} />
      <ul className="mt-8 space-y-3 text-[14px]">
        {orgSites.map((site) => (
          <li key={site.id} className="flex justify-between border-b border-[var(--border)] py-2">
            <span>{site.name}</span>
            <StatusBadge
              status={
                site.status === "DOWN" ? "Outage" : site.status === "DEGRADED" ? "Degraded" : "Operational"
              }
            />
          </li>
        ))}
      </ul>
      <h2 className="text-[13px] text-[var(--text-muted)] mt-10 mb-3">Incident history</h2>
      <ul className="text-[13px] space-y-2">
        {history.map((incident) => (
          <li key={incident.id}>
            {incident.firstDetectedAt.toISOString().slice(0, 10)} · {incident.title} · {incident.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
