import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui";

export default async function IncidentsPage() {
  const ctx = await requireOrgContext();
  const rows = await db
    .select({ incident: incidents, site: sites })
    .from(incidents)
    .innerJoin(sites, eq(sites.id, incidents.siteId))
    .where(eq(incidents.organizationId, ctx.organizationId))
    .orderBy(desc(incidents.lastDetectedAt))
    .limit(100);

  return (
    <div>
      <PageHeader title="Incidents" description="Open and historical issues for this workspace." />
      {rows.length === 0 ? (
        <p>Nothing needs your attention.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="text-left text-[var(--text-muted)]">
            <tr>
              <th className="py-2 font-medium">Incident</th>
              <th className="font-medium">Site</th>
              <th className="font-medium">Severity</th>
              <th className="font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ incident, site }) => (
              <tr key={incident.id} className="border-t border-[var(--border)]">
                <td className="py-3">
                  <Link href={`/incidents/${incident.id}`}>{incident.title}</Link>
                </td>
                <td>
                  <Link href={`/sites/${site.id}`}>{site.name}</Link>
                </td>
                <td>
                  <StatusBadge status={incident.severity} />
                </td>
                <td>
                  <StatusBadge status={incident.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
