import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents, monitorChecks, sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { Button, Input, StatusBadge } from "@/components/ui";
import { actionCreateSite } from "@/app/actions";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const ctx = await requireOrgContext();
  const params = await searchParams;
  const all = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId))
    .orderBy(desc(sites.updatedAt));
  const query = (params.q ?? "").toLowerCase();
  const filter = params.filter ?? "all";
  const filtered = all.filter((site) => {
    if (query && !`${site.name} ${site.url}`.toLowerCase().includes(query)) return false;
    if (filter === "healthy") return site.status === "HEALTHY";
    if (filter === "issues") return ["DOWN", "DEGRADED"].includes(site.status);
    if (filter === "paused") return site.status === "PAUSED";
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Sites"
        description="Websites Witch is watching for this workspace."
      />
      {all.length === 0 ? (
        <div>
          <p className="mb-4">Nothing under watch yet. Add your first website and Witch will create its initial baseline.</p>
          <AddSiteForm />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-4 text-[13px]">
            <form>
              <Input name="q" defaultValue={params.q} placeholder="Search" className="w-56" />
            </form>
            {["all", "healthy", "issues", "paused"].map((item) => (
              <Link
                key={item}
                href={`/sites?filter=${item}`}
                className={filter === item ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
              >
                {item}
              </Link>
            ))}
          </div>
          <table className="w-full text-[13px]">
            <thead className="text-[var(--text-muted)] text-left">
              <tr>
                <th className="py-2 font-medium">Site</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Last check</th>
                <th className="font-medium">Open incidents</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <SiteRow key={site.id} site={site} organizationId={ctx.organizationId} />
              ))}
            </tbody>
          </table>
          <div className="mt-10 max-w-md">
            <h2 className="text-[13px] text-[var(--text-muted)] mb-3">Add a site</h2>
            <AddSiteForm />
          </div>
        </>
      )}
    </div>
  );
}

async function SiteRow({
  site,
  organizationId,
}: {
  site: typeof sites.$inferSelect;
  organizationId: string;
}) {
  const [open] = await db
    .select({ value: count() })
    .from(incidents)
    .where(
      and(
        eq(incidents.siteId, site.id),
        eq(incidents.organizationId, organizationId),
        eq(incidents.status, "OPEN"),
      ),
    );
  const [last] = await db
    .select()
    .from(monitorChecks)
    .where(eq(monitorChecks.siteId, site.id))
    .orderBy(desc(monitorChecks.createdAt))
    .limit(1);
  return (
    <tr className="border-t border-[var(--border)]">
      <td className="py-3">
        <Link href={`/sites/${site.id}`} className="block">
          {site.name}
        </Link>
        <div className="mono text-[12px] text-[var(--text-faint)]">{site.url}</div>
      </td>
      <td>
        <StatusBadge status={site.status} />
      </td>
      <td className="text-[var(--text-muted)]">
        {site.lastCheckedAt ? site.lastCheckedAt.toISOString().slice(11, 16) : "—"}
        {last?.durationMs != null ? ` · ${last.durationMs} ms` : ""}
      </td>
      <td>{Number(open?.value ?? 0)}</td>
    </tr>
  );
}

function AddSiteForm() {
  return (
    <form action={actionCreateSite} className="flex gap-2">
      <Input name="url" placeholder="https://example.com" required />
      <Button type="submit">Add</Button>
    </form>
  );
}
