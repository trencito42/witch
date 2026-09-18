import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import {
  Globe,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";

const problems = [
  {
    title: "Broken mobile checkout",
    desc: "Server returns HTTP 200, but client-side JS fails on mobile touch listeners, removing the checkout button.",
    severity: "Critical",
  },
  {
    title: "Cookie banner overlay trap",
    desc: "A broken third-party tag renders an invisible full-page overlay, blocking every click on the site.",
    severity: "Critical",
  },
  {
    title: "Silent hydration crash",
    desc: "The HTML loads fine, but React or Vue crashes on client mount, leaving a blank white screen.",
    severity: "Critical",
  },
  {
    title: "Missing CDN hero assets",
    desc: "CDN edge 404s on the main product image. Page status is 200, but the visual experience is broken.",
    severity: "Warning",
  },
  {
    title: "CSS overflow cutoff",
    desc: "A new headline pushes your navigation menu and call-to-action out of the mobile viewport.",
    severity: "Warning",
  },
];

const layers = [
  {
    icon: Globe,
    title: "1. HTTP & Network",
    detail: "Response codes, SSL/TLS certificate validity, DNS resolution, and latency degradation.",
  },
  {
    icon: Smartphone,
    title: "2. Real Browser Execution",
    detail: "Headless Chromium rendered at 390px mobile and 1440px desktop with full JavaScript execution.",
  },
  {
    icon: Eye,
    title: "3. Visual Regression Diffing",
    detail: "Pixel-by-pixel image diffs against verified baselines with automated noise and widget masking.",
  },
  {
    icon: ShieldCheck,
    title: "4. DOM & CTA Assertions",
    detail: "Verifies critical checkout buttons, forms, and custom CSS selectors remain visible and interactive.",
  },
  {
    icon: Sparkles,
    title: "5. Spectral Root-Cause AI",
    detail: "Invoked only when tangible evidence exists to analyze console errors and failed network payloads.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Essential HTTP and TLS telemetry for personal projects.",
    features: [
      "1 site under watch",
      "HTTP, TLS & latency checks",
      "30-minute check intervals",
      "Email incident alerts",
      "Public status page",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Freelancer",
    price: "$9",
    period: "per month",
    description: "Visual and browser monitoring for client sites and indie founders.",
    features: [
      "5 sites under watch",
      "Headless Chromium browser checks",
      "Desktop & mobile visual baselines",
      "10-minute check intervals",
      "DOM element & CTA assertions",
      "Monthly PDF client reports",
    ],
    cta: "Start 14-day trial",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$24",
    period: "per month",
    description: "Complete digital observatory for client portfolios and engineering teams.",
    features: [
      "25 sites under watch",
      "5-minute check intervals",
      "Automated visual diffing & noise masks",
      "Team collaboration & role controls",
      "Discord, Slack & webhook dispatch",
      "White-label client monthly reports",
      "90-day telemetry retention",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Agency Pro",
    price: "$49",
    period: "per month",
    description: "High-frequency surveillance and extended history for large agencies.",
    features: [
      "75 sites under watch",
      "1-minute priority check intervals",
      "Full API access & automated provisioning",
      "180-day telemetry history",
      "Custom HTTP headers & auth cookies",
      "Priority triage & incident support",
    ],
    cta: "Start 14-day trial",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How does Witch differ from traditional uptime monitors?",
    a: "Traditional uptime monitors send a shallow HTTP GET or ping every few minutes. If the server responds with status 200, they mark the site green—even if the page is completely blank, CSS failed to load, or the checkout button disappeared. Witch loads the page inside an actual Chromium browser session, captures high-resolution screenshots, executes scripts, and compares the rendered result against an accepted baseline.",
  },
  {
    q: "Will Witch checks overload or degrade my client websites?",
    a: "No. Checks are carefully scheduled, rate-limited, and jittered across edge nodes. Browser sessions respect caching headers and simulate realistic user visits without flooding server resources.",
  },
  {
    q: "Can I mask dynamic elements like rotating banners or timestamps?",
    a: "Yes. Witch supports noise masking and configurable sensitivity thresholds so dynamic content, live chat widgets, and date badges don't trigger false alerts.",
  },
  {
    q: "How do client monthly reports work?",
    a: "At the end of each month, Witch generates a clean, printable PDF report detailing uptime SLA, total checks performed, response latencies, and resolved incidents. You can download or print it as-is for clients.",
  },
  {
    q: "Do I need a credit card to get started?",
    a: "No. You can create a free account and start monitoring endpoints immediately with zero payment details required.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text)] selection:bg-[var(--accent)]/30">
      <SiteHeader current="home" />

      <main className="relative overflow-hidden">
        {/* Atmosphere lights */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(187,242,176,0.07)_0%,transparent_70%)] blur-3xl -z-10" />

        {/* HERO SECTION */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-14 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-[12px] font-medium text-[var(--accent)] mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>Digital Observatory · Beyond Uptime</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight leading-[1.12] text-[var(--text)] max-w-4xl">
            Uptime tells you the server is online.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] via-emerald-300 to-[var(--text)]">
              Witch tells you if it actually works.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-[var(--text-muted)]">
            Traditional monitors ping an endpoint and assume everything is fine. Witch spins up real
            headless Chromium sessions, diffs visual baselines, and detects the silent regressions
            visitors actually see.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
            <Link
              href="/signup"
              className="btn-primary w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-6 text-[13px] font-semibold tracking-wide text-[#081008] shadow-[0_0_24px_rgba(187,242,176,0.22)] transition-all hover:bg-[var(--accent)]/90 active:scale-[0.98]"
            >
              <span>Start free monitoring</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/80 px-5 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
            >
              See realistic demo
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center sm:justify-start gap-6 text-[12px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--healthy)]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--healthy)]" />
              <span>Real Chromium browser</span>
            </div>
          </div>
        </section>

        {/* REAL PRODUCT DEMONSTRATION PANEL: HTTP 200 BUT MOBILE CHECKOUT BROKEN */}
        <section id="demo" className="mx-auto max-w-6xl px-5 sm:px-8 py-12 scroll-mt-16">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)]">
                Live Telemetry Demonstration
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)] mt-1">
                The Silent Failure: HTTP 200 OK vs Mobile Checkout Broken
              </h2>
            </div>
            <div className="text-[12px] text-[var(--text-faint)] font-mono">
              Simulated Chromium 390×844px mobile session
            </div>
          </div>

          {/* OBSERVATORY CONSOLE FRAME */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Observatory Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--critical)] animate-pulse" />
                  <span className="font-mono text-[13px] font-medium text-[var(--text)]">
                    store.example.com/checkout
                  </span>
                </div>
                <Badge variant="critical" size="sm">
                  Active Regression
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-[12px] font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Mobile Viewport (390×844)</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                  <span>Verified 18s ago</span>
                </div>
              </div>
            </div>

            {/* Split Comparison: What traditional uptime sees vs What Witch catches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]">
              {/* Left Column: Traditional Monitor */}
              <div className="p-6 space-y-4 bg-[var(--surface-1)]/30">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Traditional Uptime Monitor
                  </div>
                  <Badge variant="healthy" size="sm">
                    Reported: Normal
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-[var(--healthy)]/20 bg-[var(--healthy)]/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[var(--text)] font-medium">HTTP Status</span>
                    <span className="font-mono text-[13px] text-[var(--healthy)] font-semibold">
                      200 OK
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                    <span>Response Time</span>
                    <span className="font-mono">184 ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                    <span>TLS / Certificate</span>
                    <span className="font-mono">Valid (84 days)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] text-[12px] text-[var(--text-muted)] leading-relaxed">
                  <span className="text-[var(--text)] font-medium">Verdict:</span> Uptime check
                  passes. Customer visits the page on an iPhone, but the checkout form button is
                  completely gone due to an uncaught script error. You lose sales while your uptime
                  says 100%.
                </div>
              </div>

              {/* Right Column: Witch Observatory */}
              <div className="p-6 space-y-4 bg-[var(--surface-1)]/70">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-mono text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Witch Digital Observatory</span>
                  </div>
                  <Badge variant="critical" size="sm">
                    Alert Dispatched
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-[var(--critical)]/30 bg-[var(--critical)]/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[var(--text)] font-medium">
                      DOM CTA Assertion
                    </span>
                    <span className="font-mono text-[12px] text-[var(--critical)] font-medium">
                      FAILED (Element missing)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                    <span>Visual Regression</span>
                    <span className="font-mono text-[var(--warning)] font-medium">
                      5.84% layout shift
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                    <span>Headless Chromium Console</span>
                    <span className="font-mono text-[var(--critical)]">1 Uncaught TypeError</span>
                  </div>
                </div>

                {/* Evidence snippet */}
                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] font-mono text-[11px] leading-relaxed space-y-1">
                  <div className="text-[var(--text-faint)]">
                    # Witch Telemetry Evidence · Chromium Log
                  </div>
                  <div className="text-[var(--critical)]">
                    Uncaught TypeError: window.StripeElements is not defined (checkout.bundle.js:42)
                  </div>
                  <div className="text-[var(--warning)]">
                    Expected selector &quot;button#submit-payment&quot; not present in rendered DOM.
                  </div>
                </div>
              </div>
            </div>

            {/* Observatory AI Root-Cause Inference Strip */}
            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-0)]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-medium text-[var(--text)]">Witch Analysis: </span>
                  <span className="text-[var(--text-muted)]">
                    HTTP responded 200, but checkout bundle threw a runtime error when rendering on
                    touch devices. The payment button was pruned from DOM.
                  </span>
                </div>
              </div>
              <div className="shrink-0 font-mono text-[11px] text-[var(--text-faint)]">
                Alert dispatched via Discord &amp; Email
              </div>
            </div>
          </div>
        </section>

        {/* 5-LAYER OBSERVATORY SECTION */}
        <section id="how" className="mx-auto max-w-6xl px-5 sm:px-8 py-16 scroll-mt-16">
          <div className="max-w-2xl mb-12">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] mb-2">
              Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              The 5-Layer Observatory
            </h2>
            <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed">
              Witch combines traditional edge network telemetry with real headless browser
              rendering to ensure the full stack actually works for users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/60 p-6 hover:border-[var(--border)]/90 transition-all hover:bg-[var(--surface-1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">
                    {layer.title}
                  </h3>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                    {layer.detail}
                  </p>
                </div>
              );
            })}

            {/* Sixth highlight card: Quiet by design */}
            <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">
                  Quiet &amp; Resilient
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                  Configurable jitter, rate-limits, and noise filters mean zero alert fatigue. When
                  Witch notifies you, it&apos;s real.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[var(--border)]/60 text-[12px] font-mono text-[var(--accent)]">
                ● 99.9% Alert Accuracy
              </div>
            </div>
          </div>
        </section>

        {/* REAL FAILURE SCENARIOS WE CATCH */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/40 p-6 sm:p-10 backdrop-blur-sm">
            <div className="max-w-2xl mb-8">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--critical)] mb-2">
                Real-World Regressions
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
                Your site can be online and still be completely broken.
              </h2>
              <p className="mt-2 text-[14px] text-[var(--text-muted)]">
                Here are actual production incidents caught by Witch that ordinary uptime monitors
                missed:
              </p>
            </div>

            <div className="space-y-3">
              {problems.map((problem) => (
                <div
                  key={problem.title}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface-0)] border border-[var(--border)]/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[var(--critical)] shrink-0" />
                      <span className="text-[14px] font-medium text-[var(--text)]">
                        {problem.title}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--text-muted)] pl-6">{problem.desc}</p>
                  </div>
                  <div className="pl-6 sm:pl-0 shrink-0">
                    <Badge
                      variant={problem.severity === "Critical" ? "critical" : "warning"}
                      size="sm"
                    >
                      {problem.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLIENT-READY MONTHLY REPORTS PREVIEW */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] mb-2">
                Agency Workflows
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)] mb-4">
                Clean, printable client reports ready to send.
              </h2>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-6">
                No marketing jargon. Just pure, authoritative SLA metrics: verified uptime
                percentage, incident response history, and visual baseline confirmations. Print or
                export to PDF directly from your browser.
              </p>
              <div className="space-y-3 text-[13px] text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--healthy)]" />
                  <span>Monthly SLA uptime calculation (e.g. 99.98%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--healthy)]" />
                  <span>Detailed incident summary with timestamps &amp; duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--healthy)]" />
                  <span>Browser &amp; print optimized layout</span>
                </div>
              </div>
            </div>

            {/* Visual Report Card Preview */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[13px] font-medium text-[var(--text)]">
                    Monthly SLA Report · August
                  </span>
                </div>
                <Badge variant="healthy" size="sm">
                  100% SLA Met
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--text-faint)]">Uptime</div>
                  <div className="text-[16px] font-semibold text-[var(--healthy)] mt-0.5">
                    99.98%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--text-faint)]">Total Checks</div>
                  <div className="text-[16px] font-semibold text-[var(--text)] mt-0.5">4,320</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
                  <div className="text-[11px] text-[var(--text-faint)]">Incidents</div>
                  <div className="text-[16px] font-semibold text-[var(--text)] mt-0.5">0</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Verified endpoint: client-store.com</span>
                <span className="font-mono text-[var(--accent)]">Export PDF</span>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="mx-auto max-w-6xl px-5 sm:px-8 py-16 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] mb-2">
              Predictable Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Transparent plans that grow with your agency
            </h2>
            <p className="mt-2 text-[14px] text-[var(--text-muted)]">
              Start with free HTTP monitoring. Upgrade whenever you need real headless Chromium
              browser sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  plan.highlight
                    ? "border-[var(--accent)]/60 bg-[var(--surface-1)] shadow-[0_0_30px_rgba(187,242,176,0.1)] relative"
                    : "border-[var(--border)] bg-[var(--surface-1)]/60 hover:bg-[var(--surface-1)]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--accent)] text-[#0a0a0c] text-[11px] font-semibold uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="text-[16px] font-semibold text-[var(--text)]">{plan.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-[var(--text)]">
                      {plan.price}
                    </span>
                    <span className="text-[12px] text-[var(--text-muted)]">/{plan.period}</span>
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--text-muted)] leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-6 pt-5 border-t border-[var(--border)]/80 space-y-2.5">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-[12px] text-[var(--text)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/signup"
                    className={`w-full inline-flex h-10 items-center justify-center rounded-lg text-[12px] font-medium tracking-wide transition-all ${
                      plan.highlight
                        ? "btn-primary bg-[var(--accent)] text-[#081008] hover:bg-[var(--accent)]/90 shadow-md font-semibold"
                        : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-2)]/80"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="mx-auto max-w-4xl px-5 sm:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]/50 p-6 space-y-2"
              >
                <h3 className="text-[15px] font-semibold text-[var(--text)]">{faq.q}</h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
          <div className="relative rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]/60 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(187,242,176,0.08)_0%,transparent_70%)]" />

            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--accent)] shadow-md">
                <LogoMark size={24} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]">
                Ready to watch your websites beyond uptime?
              </h2>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                Join forward-thinking agencies and developers who sleep soundly knowing their visual
                and functional layouts are continuously verified.
              </p>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="btn-primary inline-flex h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-7 text-[13px] font-semibold tracking-wide text-[#081008] shadow-[0_0_24px_rgba(187,242,176,0.25)] transition-all hover:bg-[var(--accent)]/90"
                >
                  <span>Initialize observatory now</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)]/80 py-10 bg-[var(--surface-0)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <LogoMark size={16} />
            <span className="font-medium text-[var(--text)]">Witch</span>
            <span>— Website monitoring beyond uptime.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/#how" className="hover:text-[var(--text)] transition-colors">
              How it works
            </Link>
            <Link href="/#pricing" className="hover:text-[var(--text)] transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-[var(--text)] transition-colors">
              Sign in
            </Link>
            <span className="font-mono text-[11px] text-[var(--text-faint)]">witch.pw</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
