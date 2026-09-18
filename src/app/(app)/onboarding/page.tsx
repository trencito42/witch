import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { actionCreateSite } from "@/app/actions";
import { Button, Input, Label, Badge } from "@/components/ui";
import { Globe, ArrowRight, ShieldCheck, Camera, Sparkles } from "lucide-react";

export default async function OnboardingPage() {
  const ctx = await requireOrgContext();
  const existing = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId))
    .limit(1);
  if (existing[0]) redirect(`/sites/${existing[0].id}?onboarding=1`);

  return (
    <div className="py-6 sm:py-12 max-w-2xl mx-auto">
      {/* Background ambient lighting */}
      <div className="relative mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[11px] font-medium tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>First site</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
          Add your first site under watch
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-muted)] max-w-lg leading-relaxed">
          {ctx.plan.browserMonitoring
            ? "Witch will run HTTP checks and queue Chromium baselines for this site."
            : "Witch will run HTTP and TLS checks for this site. Visual baselines require Freelancer or above."}
        </p>
      </div>

      {/* Main card */}
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        <div className="flex items-center justify-between pb-5 mb-6 border-b border-[var(--border)]">
          <div className="text-[13px] font-medium text-[var(--text)]">
            Step 1 of 2: Configure target endpoint
          </div>
          <Badge variant={ctx.plan.browserMonitoring ? "healthy" : "secondary"}>
            {ctx.plan.browserMonitoring ? "Full Visual Telemetry Active" : "HTTP Monitoring Active"}
          </Badge>
        </div>

        <form action={actionCreateSite} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-[13px] font-medium text-[var(--text)]">
              Website URL <span className="text-[var(--critical)]">*</span>
            </Label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                required
                autoFocus
                className="pl-10 font-mono bg-[var(--surface-0)] border-[var(--border)] focus:border-[var(--accent)]/60"
              />
            </div>
            <p className="text-[11px] text-[var(--text-faint)]">
              Enter any publicly accessible URL. Witch will verify TLS, latency, and status.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px] font-medium text-[var(--text)]">
              Display Name <span className="text-[var(--text-faint)] font-normal">(optional)</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Production Web Store"
              className="bg-[var(--surface-0)] border-[var(--border)] focus:border-[var(--accent)]/60"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-semibold flex items-center justify-center gap-2"
            >
              <span>Initialize first scan{ctx.plan.browserMonitoring ? " & baseline" : ""}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Observatory feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface-1)]/40 border border-[var(--border)]/70">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-1">
            {ctx.plan.browserMonitoring ? "Visual Baseline" : "HTTP Watch"}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {ctx.plan.browserMonitoring
              ? "Pixel-level comparison across mobile and desktop browser sessions."
              : "Availability, TLS, and latency on a 30-minute Free cadence."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-1)]/40 border border-[var(--border)]/70">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--healthy)] mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-1">DOM Integrity</div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            Verifies checkout buttons, interactive scripts, and critical layout anchors.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-1)]/40 border border-[var(--border)]/70">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--info)] mb-3">
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-1">Real-time Telemetry</div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            Continuously monitors TLS certificate expiry, TTFB, and response codes.
          </p>
        </div>
      </div>
    </div>
  );
}
