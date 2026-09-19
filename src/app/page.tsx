import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/logo";
import { fontSerif, fontSans } from "@/app/fonts";

export default function HomePage() {
  return (
    <div
      className={`landing-page ${fontSerif.variable} ${fontSans.variable} overflow-x-hidden`}
      style={{ backgroundColor: "var(--landing-bg)", color: "var(--landing-text)" }}
    >
      {/* Navigation */}
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-bg)]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2 text-[var(--landing-text)]">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-6 text-[15px]">
            <Link
              href="#how"
              className="text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--landing-accent)] px-4 text-[14px] font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors"
            >
              Start monitoring
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 xl:col-span-5">
              <h1 className="landing-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-medium tracking-tight leading-[1.15] text-[var(--landing-text)]">
                Your uptime monitor says the server is online while the checkout button is gone.
              </h1>
              <p className="landing-sans landing-body mt-6 text-[var(--landing-text-muted)]">
                Witch opens pages in real desktop and mobile browsers so you catch broken layouts, failed scripts, and missing buttons before clients do.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--landing-accent)] px-6 text-[15px] font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors shadow-sm"
                >
                  Start monitoring
                </Link>
                <a
                  href="#incident"
                  className="text-[16px] font-medium text-[var(--landing-text)] underline underline-offset-4 decoration-[var(--landing-border-strong)] hover:decoration-[var(--landing-accent)] transition-colors"
                >
                  See a real incident
                </a>
              </div>
            </div>
            <div className="lg:col-span-6 xl:col-span-7 lg:-mr-16 xl:-mr-32">
              <div className="relative w-full overflow-hidden rounded-xl border border-[var(--landing-border-strong)] bg-[var(--surface-raised)] shadow-lg">
                <Image
                  src="/product-screenshot.png"
                  alt="Witch real browser monitor showing desktop and mobile diff viewports"
                  width={1200}
                  height={750}
                  priority
                  className="h-auto w-full object-cover object-left-top"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Incident story (full-bleed plum section) */}
        <section
          id="incident"
          className="w-full bg-[var(--landing-plum)] text-[var(--landing-plum-text)] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
              {/* Timeline narrative */}
              <div className="lg:col-span-5">
                <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight leading-snug">
                  An incident on [SITE]
                </h2>
                <div className="landing-sans landing-body mt-6 space-y-4 text-[var(--landing-plum-muted)]">
                  <p>
                    On [INCIDENT_DATE], a production deployment went live. The standard HTTP uptime check returned status code 200 every minute without a single alert.
                  </p>
                  <p>
                    On mobile devices at 390px viewport width, the primary checkout button failed to mount due to [CAUSE].
                  </p>
                  <p>
                    Witch captured the rendered page in Chromium, flagged the missing element against the baseline, and opened an incident within [DURATION].
                  </p>
                </div>

                {/* Timeline / Incident Log */}
                <div className="mt-8 rounded-lg border border-[var(--landing-plum-border)] bg-black/30 p-5 font-mono text-[13px] text-[var(--landing-plum-muted)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--landing-plum-border)] pb-2 text-white">
                    <span>INCIDENT RECORD</span>
                    <span>390px Mobile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Target:</span>
                    <span className="text-white">[SITE]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">HTTP Status:</span>
                    <span className="text-emerald-400">200 OK (Clean)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Visual Check:</span>
                    <span className="text-rose-400">Missing checkout button</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Time to Alert:</span>
                    <span className="text-white">[DURATION]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Root Cause:</span>
                    <span className="text-white">[CAUSE]</span>
                  </div>
                </div>
              </div>

              {/* Real screenshot before/after */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* TODO: Replace /public/incident-before.png with real captured baseline screenshot */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[13px] font-medium text-[var(--landing-plum-muted)]">
                      <span>Baseline capture</span>
                      <span className="font-mono text-[11px] text-white/50">390 × 844</span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-[var(--landing-plum-border)] bg-black/40">
                      <Image
                        src="/incident-before.png"
                        alt="Mobile baseline screenshot showing working checkout button"
                        width={800}
                        height={600}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                    <p className="text-[13px] text-[var(--landing-plum-muted)]">
                      Previous baseline: button present and interactive.
                    </p>
                  </div>

                  {/* TODO: Replace /public/incident-after.png with real captured failure screenshot */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[13px] font-medium text-rose-300">
                      <span>Deploy capture</span>
                      <span className="font-mono text-[11px] text-white/50">390 × 844</span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-rose-500/40 bg-black/40">
                      <Image
                        src="/incident-after.png"
                        alt="Mobile deploy capture showing missing checkout button and broken container"
                        width={800}
                        height={600}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                    <p className="text-[13px] text-rose-300">
                      Deploy check: button missing while HTTP returned 200.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. What Witch catches */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 py-20 sm:py-28">
          <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)]">
            What Witch catches
          </h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                Missing checkout buttons
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                Primary conversion buttons vanish after a release while the origin still answers with HTTP 200. Witch confirms that key transaction controls remain present and clickable.
              </p>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                Broken mobile layouts
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                A page displays cleanly on desktop screens but overflows or hides navigation on mobile devices. Witch inspects a 390px viewport to catch viewport-specific breakages.
              </p>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                JavaScript failures
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                The server delivers valid HTML, but client-side scripts crash and leave an empty white canvas. Witch monitors uncaught browser exceptions and unrendered components.
              </p>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                Visual regressions
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                CDN assets fail to resolve, web fonts fail to load, or layout shifts displace content. Witch flags pixel and structural differences against your accepted baseline.
              </p>
            </div>
          </div>
        </section>

        {/* 4. How it works */}
        <section id="how" className="mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-28 border-t border-[var(--landing-border)] scroll-mt-16">
          <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)]">
            How it works
          </h2>
          <div className="landing-sans landing-body mt-10 space-y-6 text-[var(--landing-text-muted)]">
            <p>
              Every check begins with connection validation. Witch verifies HTTP response codes, TLS certificate validity, and endpoint latency on every plan.
            </p>
            <p>
              On Freelancer and above, Witch loads the URL in a headless Chromium browser across 1440px desktop and 390px mobile viewports. It waits for network idle, executes scripts, and captures a true visual snapshot of the rendered page.
            </p>
            <p>
              When an unexpected change occurs, visual diffing isolates modified regions against your accepted baseline. Paid plans run automated analysis to diagnose failures and attach console errors directly to the incident record.
            </p>
          </div>
        </section>

        {/* 5. For agencies */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28 border-t border-[var(--landing-border)]">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Real-looking PDF Document Preview (strictly left-aligned, zero rotation) */}
            <div className="lg:col-span-6">
              <div className="w-full max-w-md rounded-lg border border-[var(--landing-border-strong)] bg-white p-8 shadow-md">
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                      Monthly Client Maintenance
                    </span>
                    <h4 className="text-[16px] font-semibold text-stone-900">
                      Site Reliability Summary
                    </h4>
                  </div>
                  <span className="text-[12px] font-mono text-stone-500">
                    October 2026
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-[13px]">
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-600">Client Property</span>
                    <span className="font-medium text-stone-900">client-store.com</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-600">HTTP &amp; TLS Uptime</span>
                    <span className="font-medium text-emerald-700">99.98% Healthy</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-600">Headless Browser Checks</span>
                    <span className="font-medium text-stone-900">1,440 checks (30m cadence)</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-600">Incidents Detected &amp; Fixed</span>
                    <span className="font-medium text-stone-900">1 (Mobile checkout CTA missing)</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="text-stone-600">Mean Time to Recovery</span>
                    <span className="font-medium text-stone-900">18 minutes</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-stone-600">Visual Regressions</span>
                    <span className="font-medium text-stone-900">0 unresolved</span>
                  </div>
                </div>

                <div className="mt-6 rounded border border-stone-200 bg-stone-50 p-3 text-[12px] text-stone-600">
                  Document generated directly from your browser. Printable and exportable to PDF for client retainers.
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="lg:col-span-6">
              <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)] leading-tight">
                Monthly reports your clients can actually read
              </h2>
              <div className="landing-sans landing-body mt-6 space-y-4 text-[var(--landing-text-muted)]">
                <p>
                  Agency retainers often look invisible until something breaks. Witch documents your active care by logging uptime, headless browser verifications, and resolved visual errors.
                </p>
                <p>
                  Open the report directly in your dashboard and print clean, professional PDFs without third-party generation services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Founder note */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-28 border-t border-[var(--landing-border)]">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Photo placeholder */}
            <div className="shrink-0">
              <div className="h-20 w-20 rounded-full border border-[var(--landing-border-strong)] bg-stone-200 flex items-center justify-center text-[12px] font-medium text-stone-600">
                Photo
              </div>
            </div>

            {/* First-person paragraph */}
            <div className="space-y-4">
              <h3 className="landing-serif text-2xl sm:text-3xl font-medium text-[var(--landing-text)]">
                Why I built Witch
              </h3>
              <p className="landing-sans landing-body text-[var(--landing-text-muted)]">
                I spent years maintaining web projects for clients where traditional monitors gave a false sense of security. A deployment would slip through with a broken script or a missing form, and the uptime ping stayed green while clients lost leads. I built Witch so independent developers and agency teams would receive alerts the moment a real browser cannot load their interface properly.
              </p>
              <p className="text-[16px] font-medium text-[var(--landing-text)]">
                [FOUNDER_NAME]
              </p>
            </div>
          </div>
        </section>

        {/* 7. Pricing (Horizontal rows / comparison list) */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28 border-t border-[var(--landing-border)] scroll-mt-16">
          <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)]">
            Simple, predictable plans
          </h2>
          <p className="landing-sans landing-body mt-4 text-[var(--landing-text-muted)] max-w-2xl">
            Start with free HTTP checks. Upgrade to Freelancer or Agency when you need headless Chromium rendering, mobile viewports, and visual diff alerts.
          </p>

          <div className="mt-12 space-y-4">
            {/* Free */}
            <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--surface-raised)] p-6 sm:p-8 transition-colors">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-semibold text-[var(--landing-text)]">Free</h3>
                  <div className="mt-2 text-3xl font-medium tracking-tight text-[var(--landing-text)]">
                    $0
                    <span className="text-[14px] font-normal text-[var(--landing-text-muted)]"> forever</span>
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--landing-text-muted)]">
                    HTTP monitoring for one public site.
                  </p>
                </div>
                <div className="lg:col-span-6">
                  <ul className="grid gap-2 text-[14px] text-[var(--landing-text)] sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      1 site
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      HTTP, TLS, and latency
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      30-minute interval
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      7-day history
                    </li>
                    <li className="flex items-center gap-2 sm:col-span-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Public status page
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3 lg:text-right">
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full lg:w-auto items-center justify-center rounded-md border border-[var(--landing-border-strong)] bg-[var(--surface-overlay)] px-5 text-[14px] font-medium text-[var(--landing-text)] hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    Start free
                  </Link>
                </div>
              </div>
            </div>

            {/* Freelancer */}
            <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--surface-raised)] p-6 sm:p-8 transition-colors">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-semibold text-[var(--landing-text)]">Freelancer</h3>
                  <div className="mt-2 text-3xl font-medium tracking-tight text-[var(--landing-text)]">
                    $9
                    <span className="text-[14px] font-normal text-[var(--landing-text-muted)]"> / month</span>
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--landing-text-muted)]">
                    Browser checks and visual diffs for client projects.
                  </p>
                </div>
                <div className="lg:col-span-6">
                  <ul className="grid gap-2 text-[14px] text-[var(--landing-text)] sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      5 sites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Chromium on desktop and mobile
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Visual baselines
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Email and Discord alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      AI incident analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Printable monthly reports
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3 lg:text-right">
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full lg:w-auto items-center justify-center rounded-md border border-[var(--landing-border-strong)] bg-[var(--surface-overlay)] px-5 text-[14px] font-medium text-[var(--landing-text)] hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>

            {/* Agency (Highlighted with subtle background tint only, no badge) */}
            <div className="rounded-xl border border-[var(--landing-accent)]/40 bg-[var(--accent-dim)] p-6 sm:p-8 transition-colors">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-semibold text-[var(--landing-text)]">Agency</h3>
                  <div className="mt-2 text-3xl font-medium tracking-tight text-[var(--landing-text)]">
                    $24
                    <span className="text-[14px] font-normal text-[var(--landing-text-muted)]"> / month</span>
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--landing-text-muted)]">
                    Client portfolios and growing teams.
                  </p>
                </div>
                <div className="lg:col-span-6">
                  <ul className="grid gap-2 text-[14px] text-[var(--landing-text)] sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      25 sites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Visual diffs with ignore masks
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Up to 10 members
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Alerts and reports
                    </li>
                    <li className="flex items-center gap-2 sm:col-span-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      90-day history
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3 lg:text-right">
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full lg:w-auto items-center justify-center rounded-md bg-[var(--landing-accent)] px-6 text-[14px] font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors shadow-sm"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>

            {/* Agency Pro */}
            <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--surface-raised)] p-6 sm:p-8 transition-colors">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <h3 className="text-xl font-semibold text-[var(--landing-text)]">Agency Pro</h3>
                  <div className="mt-2 text-3xl font-medium tracking-tight text-[var(--landing-text)]">
                    $49
                    <span className="text-[14px] font-normal text-[var(--landing-text-muted)]"> / month</span>
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--landing-text-muted)]">
                    Higher limits, priority checks, longer history.
                  </p>
                </div>
                <div className="lg:col-span-6">
                  <ul className="grid gap-2 text-[14px] text-[var(--landing-text)] sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      75 sites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Priority check jitter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      180-day history
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Advanced reporting
                    </li>
                    <li className="flex items-center gap-2 sm:col-span-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                      Up to 25 members
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3 lg:text-right">
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full lg:w-auto items-center justify-center rounded-md border border-[var(--landing-border-strong)] bg-[var(--surface-overlay)] px-5 text-[14px] font-medium text-[var(--landing-text)] hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ (Exactly 3 questions, max 2 sentences each) */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-28 border-t border-[var(--landing-border)]">
          <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)]">
            Frequently asked questions
          </h2>
          <div className="mt-12 space-y-10">
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                How does Witch differ from uptime monitoring?
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                Traditional uptime monitors only ping an endpoint to check for HTTP 200, which stays green even if scripts crash or buttons disappear. Witch loads the page in a headless browser to verify the visual interface and document state that visitors actually see.
              </p>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                Will running headless browser checks slow down my site?
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                No. Checks run in isolated browser contexts with jitter, concurrency limits, and strict resource abort thresholds for heavy assets. Your production visitors never share sessions or connections with the monitor.
              </p>
            </div>
            <div>
              <h3 className="text-[19px] font-semibold text-[var(--landing-text)]">
                What happens when a problem is detected?
              </h3>
              <p className="landing-sans landing-body mt-2 text-[var(--landing-text-muted)]">
                Witch immediately opens an incident record with the visual comparison, DOM snapshot, and browser console logs. Paid plans send alerts to your team through email or Discord and mark the incident resolved once the page recovers.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Final CTA (One line and one button) */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-24 sm:py-32 text-center border-t border-[var(--landing-border)]">
          <h2 className="landing-serif text-3xl sm:text-4xl font-medium tracking-tight text-[var(--landing-text)]">
            Catch silent breakages before your clients do.
          </h2>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--landing-accent)] px-8 text-[15px] font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors shadow-sm"
            >
              Start monitoring
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row sm:px-10 text-[14px] text-[var(--landing-text-muted)]">
          <Link href="/" className="flex items-center gap-2 text-[var(--landing-text)]">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="#how" className="hover:text-[var(--landing-text)] transition-colors">
              How it works
            </Link>
            <Link href="#pricing" className="hover:text-[var(--landing-text)] transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-[var(--landing-text)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
