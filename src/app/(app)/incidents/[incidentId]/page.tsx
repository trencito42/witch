import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { incidentEvents, incidents, sites, visualDiffs } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { Button, StatusBadge } from "@/components/ui";
import { actionAcceptBaseline, actionIncident } from "@/app/actions";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const ctx = await requireOrgContext();
  const { incidentId } = await params;
  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, incidentId), eq(incidents.organizationId, ctx.organizationId)))
    .limit(1);
  if (!incident) notFound();
  const [site] = await db.select().from(sites).where(eq(sites.id, incident.siteId)).limit(1);
  const events = await db
    .select()
    .from(incidentEvents)
    .where(
      and(
        eq(incidentEvents.incidentId, incident.id),
        eq(incidentEvents.organizationId, ctx.organizationId),
      ),
    );
  const evidence = Array.isArray((incident.metadata as { evidence?: string[] } | null)?.evidence)
    ? (incident.metadata as { evidence: string[] }).evidence
    : [];
  const analysis = incident.aiAnalysis as {
    summary?: string;
    likelyCause?: string;
    confidence?: number;
  } | null;
  const failed = (incident.metadata as { failedRequests?: { url: string; status: number }[] } | null)
    ?.failedRequests;
  const [diff] = incident.monitorId
    ? await db
        .select()
        .from(visualDiffs)
        .where(
          and(
            eq(visualDiffs.monitorId, incident.monitorId),
            eq(visualDiffs.organizationId, ctx.organizationId),
          ),
        )
        .limit(1)
    : [];

  return (
    <div className="max-w-3xl">
      <p className="text-[12px] text-[var(--text-muted)] mb-2">
        <Link href={`/sites/${site?.id}`}>{site?.name}</Link>
      </p>
      <h1 className="text-xl mb-2">{incident.title}</h1>
      <div className="flex gap-4 text-[13px] mb-6">
        <StatusBadge status={incident.severity} />
        <StatusBadge status={incident.status} />
        <span className="text-[var(--text-muted)]">{incident.category}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-[13px] mb-8">
        <div>
          <dt className="text-[var(--text-muted)]">First detected</dt>
          <dd>{incident.firstDetectedAt.toISOString()}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Last detected</dt>
          <dd>{incident.lastDetectedAt.toISOString()}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Occurrences</dt>
          <dd>{incident.occurrenceCount}</dd>
        </div>
      </dl>
      <p className="text-[14px] mb-6">{incident.summary}</p>
      {analysis && (
        <section className="mb-8">
          <h2 className="text-[13px] text-[var(--text-muted)] mb-2">AI summary</h2>
          <p className="text-[14px]">{analysis.summary}</p>
          {analysis.likelyCause && (
            <p className="text-[13px] text-[var(--text-muted)] mt-2">{analysis.likelyCause}</p>
          )}
          {analysis.confidence != null && (
            <p className="text-[12px] text-[var(--text-faint)] mt-2">
              Confidence {(analysis.confidence * 100).toFixed(0)}%
            </p>
          )}
        </section>
      )}
      <section className="mb-8">
        <h2 className="text-[13px] text-[var(--text-muted)] mb-2">Evidence</h2>
        <ul className="text-[13px] list-disc pl-4 space-y-1">
          {evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {failed && (
          <ul className="mt-3 text-[12px] mono text-[var(--text-muted)]">
            {failed.slice(0, 20).map((item) => (
              <li key={item.url}>
                {item.status} {item.url}
              </li>
            ))}
          </ul>
        )}
      </section>
      {diff && (
        <section className="mb-8 grid md:grid-cols-3 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/snapshot/${diff.baselineSnapshotId}`} alt="Before" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/snapshot/${diff.currentSnapshotId}`} alt="After" />
          {diff.diffStorageKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/media/diff/${diff.id}`} alt="Diff" />
          )}
        </section>
      )}
      <div className="flex flex-wrap gap-2 mb-10">
        <form action={actionIncident.bind(null, "ack", incident.id)}>
          <Button variant="secondary">Acknowledge</Button>
        </form>
        <form action={actionIncident.bind(null, "resolve", incident.id)}>
          <Button variant="secondary">Resolve manually</Button>
        </form>
        <form action={actionIncident.bind(null, "ignore", incident.id)}>
          <Button variant="ghost">Ignore</Button>
        </form>
        {diff && (
          <form action={actionAcceptBaseline.bind(null, diff.currentSnapshotId, incident.siteId)}>
            <Button>Accept current visual baseline</Button>
          </form>
        )}
      </div>
      <h2 className="text-[13px] text-[var(--text-muted)] mb-2">Timeline</h2>
      <ul className="text-[13px] space-y-2">
        {events.map((event) => (
          <li key={event.id}>
            <span className="text-[var(--text-faint)]">{event.createdAt.toISOString().slice(11, 16)}</span>{" "}
            {event.type} · {event.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
