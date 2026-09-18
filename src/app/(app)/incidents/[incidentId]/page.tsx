import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { incidentEvents, incidents, sites, visualDiffs } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { Button, StatusBadge, Badge } from "@/components/ui";
import { actionAcceptBaseline, actionIncident } from "@/app/actions";
import {
  ChevronLeft,
  Globe,
  Clock,
  CheckCircle2,
  FileSearch,
  Sparkles,
  Layers,
  History,
  Check,
  Eye,
} from "lucide-react";

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

  const visualDiffId = (incident.metadata as { visualDiffId?: string } | null)?.visualDiffId;
  const [diff] = visualDiffId
    ? await db
        .select()
        .from(visualDiffs)
        .where(
          and(
            eq(visualDiffs.id, visualDiffId),
            eq(visualDiffs.organizationId, ctx.organizationId),
            eq(visualDiffs.siteId, incident.siteId),
          ),
        )
        .limit(1)
    : [];

  return (
    <div className="space-y-8 max-w-4xl animate-spectral-fade">
      {/* Breadcrumb Back */}
      <div>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Incidents</span>
        </Link>
      </div>

      {/* Incident Header */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.severity} />
            <StatusBadge status={incident.status} />
            <Badge variant="outline" className="uppercase mono text-[10px]">
              {incident.category}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] mono">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Detected {new Date(incident.firstDetectedAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[var(--text)] break-words">
            {incident.title}
          </h1>
          {site && (
            <Link
              href={`/sites/${site.id}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--accent)] mt-1.5 transition-colors min-w-0 max-w-full"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{site.name}</span>
              <span className="mono text-[11px] text-[var(--text-faint)] truncate">({site.url})</span>
            </Link>
          )}
        </div>

        <p className="text-[14px] text-[var(--text)] leading-relaxed pt-2 border-t border-[var(--border)]">
          {incident.summary}
        </p>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-3 border-t border-[var(--border)] [&_form]:w-full sm:[&_form]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          {incident.status === "OPEN" && (
            <form action={actionIncident.bind(null, "ack", incident.id)}>
              <Button variant="secondary" size="sm" leadingIcon={<Check className="h-3.5 w-3.5" />}>
                Acknowledge
              </Button>
            </form>
          )}

          {incident.status !== "RESOLVED" && (
            <form action={actionIncident.bind(null, "resolve", incident.id)}>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Resolve manually
              </Button>
            </form>
          )}

          {incident.status !== "IGNORED" && (
            <form action={actionIncident.bind(null, "ignore", incident.id)}>
              <Button variant="ghost" size="sm">
                Ignore
              </Button>
            </form>
          )}

          {diff && (
            <form action={actionAcceptBaseline.bind(null, diff.currentSnapshotId, incident.siteId)}>
              <Button variant="outline" size="sm" leadingIcon={<Eye className="h-3.5 w-3.5" />}>
                Accept current visual baseline
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* WITCH ANALYSIS (DISTINGUISHED INFERENCE) */}
      {analysis && (
        <section className="p-6 rounded-2xl border border-[rgba(187,242,176,0.3)] bg-gradient-to-b from-[var(--accent-dim)] to-transparent space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
              <span>Witch Automated Diagnosis (Inference)</span>
            </div>
            {analysis.confidence != null && (
              <span className="mono text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[rgba(187,242,176,0.3)] text-[var(--accent)]">
                Confidence {(analysis.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="text-[13px] text-[var(--text)] leading-relaxed">
            {analysis.summary}
          </div>

          {analysis.likelyCause && (
            <div className="pt-2 border-t border-[rgba(187,242,176,0.15)] text-[12px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Likely Cause:</span> {analysis.likelyCause}
            </div>
          )}
        </section>
      )}

      {/* OBSERVED EVIDENCE */}
      <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
        <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[var(--accent)]" />
          Factual Telemetry Evidence
        </h2>

        {evidence.length > 0 ? (
          <ul className="space-y-2">
            {evidence.map((item, i) => (
              <li key={i} className="text-[13px] text-[var(--text-muted)] flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] mt-1.5 shrink-0" />
                <span className="break-words min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[13px] text-[var(--text-muted)]">No textual evidence recorded.</div>
        )}

        {failed && failed.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <div className="text-[12px] font-medium text-[var(--critical)] uppercase tracking-wider">
              Failed Network Requests ({failed.length})
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
              <ul className="divide-y divide-[var(--border)] text-[12px] mono">
                {failed.slice(0, 20).map((req, i) => (
                  <li key={i} className="p-2.5 flex items-center justify-between gap-4">
                    <span className="truncate text-[var(--text-muted)] min-w-0 break-all">{req.url}</span>
                    <span className="px-1.5 py-0.5 rounded-xs bg-[var(--critical-dim)] text-[var(--critical)] font-bold shrink-0">
                      {req.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* VISUAL REGRESSION DIFF SNAPSHOTS */}
      {diff && (
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
          <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--accent)]" />
            Visual Regression Snapshots
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Accepted Baseline
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-black overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/snapshot/${diff.baselineSnapshotId}`}
                  alt="Baseline frame"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Captured Frame
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-black overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/snapshot/${diff.currentSnapshotId}`}
                  alt="Current frame"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {diff.diffStorageKey && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--warning)]">
                  Differential Mask
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-black overflow-hidden aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/diff/${diff.id}`}
                    alt="Diff heatmap"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* EVENT TIMELINE */}
      <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
        <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--accent)]" />
          Incident Event Timeline
        </h2>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[var(--border)]">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
              <div className="text-[12px] text-[var(--text)]">
                <span className="mono text-[var(--text-muted)] mr-2">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-medium text-[var(--accent)] mr-2 uppercase text-[10px]">
                  [{event.type}]
                </span>
                <span>{event.message}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

