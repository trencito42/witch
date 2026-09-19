import Image from "next/image";
import Link from "next/link";
import { fontSans, fontSerif } from "@/app/fonts";
import { Wordmark } from "@/components/logo";

const signals = [
  {
    label: "Rendered UI",
    title: "Missing buttons and forms",
    body: "Witch compares the page visitors actually receive, so a green HTTP response cannot hide a missing checkout, signup, or booking control.",
  },
  {
    label: "Viewport",
    title: "Mobile-only breakage",
    body: "Desktop and 390px mobile checks keep separate baselines, catching overflow, hidden navigation, and responsive layouts that quietly collapse.",
  },
  {
    label: "Browser",
    title: "JavaScript and asset failures",
    body: "Console errors, failed scripts, broken images, error pages, and incomplete renders are collected as evidence instead of disappearing behind a 200 status.",
  },
  {
    label: "Visual",
    title: "Meaningful regressions",
    body: "Accepted baselines, ignore regions, and stabilization reduce noise so visual changes can become useful incidents rather than a screenshot inbox.",
  },
];

const steps = [
  {
    number: "01",
    title: "Check the connection",
    body: "HTTP status, TLS validity, redirects, and latency are checked first with public-network validation and strict fetch limits.",
  },
  {
    number: "02",
    title: "Open the page",
    body: "Paid plans render the site in Chromium on desktop and mobile, wait for the page to stabilize, then capture DOM signals and a visual snapshot.",
  },
  {
    number: "03",
    title: "Explain the change",
    body: "Witch compares the result with the accepted baseline, opens an incident when the evidence matters, and can attach AI analysis on paid plans.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "For one public site",
    accent: false,
    features: ["1 site", "HTTP, TLS, latency", "30-minute interval", "7-day history", "Public status page"],
  },
  {
    name: "Freelancer",
    price: "$9",
    note: "For independent developers",
    accent: false,
    features: ["5 sites", "Desktop + mobile Chromium", "Visual baselines", "Email + Discord alerts", "AI incident analysis", "30-day history"],
  },
  {
    name: "Agency",
    price: "$24",
    note: "For client portfolios",
    accent: true,
    features: ["25 sites", "Visual ignore masks", "Up to 10 members", "Reports + alerts", "90-day history", "5 workspaces"],
  },
  {
    name: "Agency Pro",
    price: "$49",
    note: "For larger portfolios",
    accent: false,
    features: ["75 sites", "5-minute browser interval", "Priority checks", "Advanced reporting", "180-day history", "Up to 25 members"],
  },
];

const questions = [
  {
    q: "How is this different from an uptime monitor?",
    a: "An uptime monitor can stay green while the interface is unusable. Witch keeps HTTP and TLS checks, then adds real browser rendering, visual baselines, DOM signals, and browser errors on paid plans.",
  },
  {
    q: "Will Witch hammer my website?",
    a: "No. Checks use plan-based intervals, jitter, concurrency limits, request caps, byte budgets, and isolated browser contexts. It is designed to observe a page, not crawl an entire site.",
  },
  {
    q: "What happens when something changes?",
    a: "Witch records the evidence and classifies the failure. Uptime failures are confirmed before alerting, visual and browser issues can open incidents, and recovery requires healthy checks before the incident closes.",
  },
];

export default function HomePage() {
  return (
    <div
      className={"landing-page " + fontSerif.variable + " " + fontSans.variable + " overflow-x-hidden"}
      style={{ backgroundColor: "var(--landing-bg)", color: "var(--landing-text)" }}
    >
      <header className="sticky top-0 z-50 bg-[var(--landing-bg)]/84 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Witch home" className="text-[var(--landing-text)]">
            <Wordmark />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-5 text-[14px]">
            <a href="#how" className="hidden sm:inline text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]">
              How it works
            </a>
            <a href="#pricing" className="hidden md:inline text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]">
              Pricing
            </a>
            <Link href="/login" className="hidden sm:inline text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--landing-text)] px-4 text-[13px] font-semibold text-[var(--landing-bg)] transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[760px] opacity-70">
            <Image src="/header-landing.png" alt="" fill priority sizes="100vw" className="object-cover object-top opacity-60 mix-blend-screen" />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px]"
            style={{
              background:
                "radial-gradient(circle at 50% 18%, rgba(142,102,166,.16), transparent 36%), linear-gradient(to bottom, rgba(7,7,9,.22), rgba(7,7,9,.62) 58%, var(--landing-bg) 100%)",
            }}
          />

          <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 text-center sm:px-8 sm:pb-28 sm:pt-28 lg:px-10 lg:pt-32">
            <p className="landing-sans text-[12px] font-medium uppercase tracking-[0.22em] text-[var(--landing-text-muted)]">
              Browser monitoring beyond uptime
            </p>
            <h1 className="landing-serif mx-auto mt-6 max-w-4xl text-[2.65rem] font-medium leading-[1.02] tracking-[-0.035em] text-[var(--landing-text)] sm:text-6xl lg:text-[4.9rem]">
              Your site can be online
              <span className="block text-[var(--landing-text-muted)]">and completely broken.</span>
            </h1>
            <p className="landing-sans mx-auto mt-7 max-w-2xl text-[17px] leading-7 text-[var(--landing-text-muted)] sm:text-[19px]">
              Witch watches the page, not just the port. It checks HTTP and TLS, then uses Chromium to catch missing controls,
              broken mobile layouts, failed scripts, and visual regressions.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--landing-text)] px-7 text-[14px] font-semibold text-[var(--landing-bg)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Monitor your first site
              </Link>
              <a
                href="#incident"
                className="inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-[14px] font-medium text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)] sm:w-auto"
              >
                See what Witch catches ↓
              </a>
            </div>
            <p className="mt-4 text-[12px] text-[var(--landing-text-muted)]">Free HTTP + TLS monitoring. No credit card.</p>

            <div className="mx-auto mt-14 max-w-6xl sm:mt-20">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-[var(--landing-text-muted)]">
                <span>HTTP 200 ✓</span>
                <span className="text-rose-300">Checkout CTA missing</span>
                <span>Mobile · 390px</span>
                <span>Evidence attached</span>
              </div>
              <div className="relative overflow-hidden rounded-[22px] bg-white/[0.025] p-1 shadow-[0_35px_120px_rgba(0,0,0,.42)] ring-1 ring-white/[0.08]">
                <Image
                  src="/product-screenshot.png"
                  alt="Witch dashboard showing browser monitoring and visual evidence"
                  width={1600}
                  height={1000}
                  priority
                  className="h-auto w-full rounded-[18px] object-cover object-left-top"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">The gap</p>
            <h2 className="landing-serif mt-4 text-4xl font-medium leading-tight tracking-[-0.025em] sm:text-5xl">
              Green does not mean working.
            </h2>
            <p className="landing-sans mt-5 text-[17px] leading-7 text-[var(--landing-text-muted)]">
              A server can answer perfectly while the thing users came to do has vanished. Witch is built for that uncomfortable
              space between “the host is alive” and “the product actually works.”
            </p>
          </div>

          <div className="mt-16 divide-y divide-white/[0.07]">
            {signals.map((item) => (
              <div key={item.title} className="grid gap-3 py-8 sm:grid-cols-[150px_1fr] sm:gap-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--landing-text-muted)]">{item.label}</p>
                <div>
                  <h3 className="text-[20px] font-medium text-[var(--landing-text)]">{item.title}</h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--landing-text-muted)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="incident" className="relative overflow-hidden bg-[#140d18] py-20 text-[#f6f1f7] sm:py-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(circle at 74% 30%, rgba(169,113,194,.16), transparent 33%), radial-gradient(circle at 18% 75%, rgba(82,50,99,.2), transparent 30%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Fixture replay</p>
                <h2 className="landing-serif mt-4 text-4xl font-medium leading-tight tracking-[-0.025em] sm:text-5xl">
                  HTTP stayed green.
                  <span className="block text-[#cdaed7]">The checkout disappeared.</span>
                </h2>
                <p className="mt-6 max-w-xl text-[16px] leading-7 text-white/60">
                  This is the failure case Witch uses in its own test fixture: the page still responds, but the primary checkout
                  control disappears on the mobile render.
                </p>

                <div className="mt-8 space-y-0 border-y border-white/10 font-mono text-[12px]">
                  <div className="flex items-center justify-between gap-5 py-3">
                    <span className="text-white/40">HTTP</span>
                    <span className="text-emerald-300">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between gap-5 border-t border-white/10 py-3">
                    <span className="text-white/40">Viewport</span>
                    <span>390px mobile</span>
                  </div>
                  <div className="flex items-center justify-between gap-5 border-t border-white/10 py-3">
                    <span className="text-white/40">DOM signal</span>
                    <span className="text-rose-300">Checkout missing</span>
                  </div>
                  <div className="flex items-center justify-between gap-5 border-t border-white/10 py-3">
                    <span className="text-white/40">Evidence</span>
                    <span>Screenshot + browser signals</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <figure>
                    <figcaption className="mb-3 flex items-center justify-between text-[12px] text-white/45">
                      <span>Accepted baseline</span>
                      <span className="font-mono">390 × 844</span>
                    </figcaption>
                    <div className="overflow-hidden rounded-[18px] bg-black/30 ring-1 ring-white/10">
                      <Image src="/incident-before.png" alt="Fixture baseline with checkout button present" width={800} height={600} className="h-auto w-full" />
                    </div>
                  </figure>
                  <figure>
                    <figcaption className="mb-3 flex items-center justify-between text-[12px] text-rose-200/75">
                      <span>Broken render</span>
                      <span className="font-mono text-white/45">390 × 844</span>
                    </figcaption>
                    <div className="overflow-hidden rounded-[18px] bg-black/30 ring-1 ring-rose-300/20">
                      <Image src="/incident-after.png" alt="Fixture render with checkout button missing" width={800} height={600} className="h-auto w-full" />
                    </div>
                  </figure>
                </div>
                <p className="mt-5 text-[13px] leading-6 text-white/45">
                  Deterministic fixture example used to exercise the browser-monitoring pipeline. No invented customer name,
                  fabricated incident date, or fake “production” claim.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">How it works</p>
              <h2 className="landing-serif mt-4 text-4xl font-medium leading-tight tracking-[-0.025em] sm:text-5xl">
                Three layers.
                <span className="block text-[var(--landing-text-muted)]">One incident timeline.</span>
              </h2>
            </div>
            <ol className="divide-y divide-white/[0.07]">
              {steps.map((step) => (
                <li key={step.number} className="grid gap-3 py-7 first:pt-0 sm:grid-cols-[54px_1fr]">
                  <span className="font-mono text-[11px] text-[var(--landing-text-muted)]">{step.number}</span>
                  <div>
                    <h3 className="text-[19px] font-medium">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-[var(--landing-text-muted)]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="relative overflow-hidden rounded-[28px] bg-white/[0.035] px-6 py-10 ring-1 ring-white/[0.07] sm:px-10 sm:py-14 lg:px-14">
            <div
              className="pointer-events-none absolute right-[-120px] top-[-140px] h-[360px] w-[360px] rounded-full opacity-40 blur-3xl"
              style={{ background: "rgba(145, 94, 168, .18)" }}
            />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">For client work</p>
                <h2 className="landing-serif mt-4 text-4xl font-medium leading-tight tracking-[-0.025em] sm:text-5xl">
                  Make invisible maintenance visible.
                </h2>
                <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--landing-text-muted)]">
                  Witch keeps a record of checks, incidents, recoveries, and visual evidence. Agency plans add team access,
                  longer history, and reports you can open in the app and print or save as PDF.
                </p>
              </div>

              <div className="bg-[#f4f1ec] p-6 text-[#191818] shadow-2xl sm:p-8">
                <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Example report</p>
                    <h3 className="mt-1 text-[17px] font-semibold">Monthly reliability summary</h3>
                  </div>
                  <span className="font-mono text-[10px] text-black/40">30 days</span>
                </div>
                <dl className="mt-5 space-y-4 text-[13px]">
                  <div className="flex justify-between gap-5">
                    <dt className="text-black/50">HTTP uptime</dt>
                    <dd className="font-medium">Included</dd>
                  </div>
                  <div className="flex justify-between gap-5 border-t border-black/10 pt-4">
                    <dt className="text-black/50">Browser checks</dt>
                    <dd className="font-medium">Desktop + mobile</dd>
                  </div>
                  <div className="flex justify-between gap-5 border-t border-black/10 pt-4">
                    <dt className="text-black/50">Incidents</dt>
                    <dd className="font-medium">Detected + resolved</dd>
                  </div>
                  <div className="flex justify-between gap-5 border-t border-black/10 pt-4">
                    <dt className="text-black/50">Visual evidence</dt>
                    <dd className="font-medium">Attached when available</dd>
                  </div>
                </dl>
                <p className="mt-6 border-t border-black/10 pt-4 text-[11px] leading-5 text-black/45">
                  Illustrative layout. Report values come from the monitored workspace, not from marketing sample data.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">Pricing</p>
            <h2 className="landing-serif mt-4 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
              Start small. Upgrade when the browser matters.
            </h2>
            <p className="mt-5 text-[16px] leading-7 text-[var(--landing-text-muted)]">
              Free covers basic availability. Paid plans unlock Chromium, visual monitoring, alerts, AI analysis, and longer history.
            </p>
          </div>

          <div className="mt-14 divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  "grid gap-7 py-8 lg:grid-cols-[190px_120px_1fr_auto] lg:items-center " +
                  (plan.accent ? "bg-white/[0.025] -mx-4 px-4 sm:-mx-6 sm:px-6" : "")
                }
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-medium">{plan.name}</h3>
                    {plan.accent ? (
                      <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-[var(--landing-text-muted)]">popular</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--landing-text-muted)]">{plan.note}</p>
                </div>
                <p className="text-3xl font-medium tracking-tight">
                  {plan.price}
                  {plan.price !== "$0" ? <span className="ml-1 text-[11px] font-normal text-[var(--landing-text-muted)]">/mo</span> : null}
                </p>
                <ul className="grid gap-x-8 gap-y-2 text-[13px] text-[var(--landing-text-muted)] sm:grid-cols-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--landing-text-muted)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={
                    plan.accent
                      ? "inline-flex h-10 items-center justify-center rounded-full bg-[var(--landing-text)] px-5 text-[13px] font-semibold text-[var(--landing-bg)] transition-opacity hover:opacity-90"
                      : "inline-flex h-10 items-center justify-center rounded-full bg-white/[0.055] px-5 text-[13px] font-semibold text-[var(--landing-text)] transition-colors hover:bg-white/[0.09]"
                  }
                >
                  {plan.price === "$0" ? "Start free" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="landing-serif text-4xl font-medium tracking-[-0.025em] sm:text-5xl">A few useful answers.</h2>
          <div className="mt-12 divide-y divide-white/[0.07]">
            {questions.map((item) => (
              <div key={item.q} className="py-7">
                <h3 className="text-[18px] font-medium">{item.q}</h3>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--landing-text-muted)]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-28 pt-16 text-center sm:px-8 sm:pb-36 sm:pt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">The server is not the product.</p>
          <h2 className="landing-serif mx-auto mt-5 max-w-3xl text-4xl font-medium leading-tight tracking-[-0.03em] sm:text-6xl">
            Know when the page stops doing its job.
          </h2>
          <Link
            href="/signup"
            className="mt-9 inline-flex h-12 items-center justify-center rounded-full bg-[var(--landing-text)] px-8 text-[14px] font-semibold text-[var(--landing-bg)] transition-transform hover:-translate-y-0.5"
          >
            Start monitoring
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-[13px] text-[var(--landing-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link href="/" aria-label="Witch home" className="text-[var(--landing-text)]">
            <Wordmark />
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a href="#how" className="transition-colors hover:text-[var(--landing-text)]">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-[var(--landing-text)]">Pricing</a>
            <Link href="/login" className="transition-colors hover:text-[var(--landing-text)]">Sign in</Link>
            <Link href="/signup" className="transition-colors hover:text-[var(--landing-text)]">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
