import Link from "next/link";
import { Check, CircleAlert, Eye, Globe2, ShieldCheck } from "lucide-react";
import { fontSans, fontSerif } from "@/app/fonts";
import { Wordmark } from "@/components/logo";

const signals = [
  {
    label: "Rendered UI",
    title: "Missing buttons and forms",
    body: "A green response cannot hide a checkout, login, booking form, or CTA that vanished after deploy.",
  },
  {
    label: "Viewport",
    title: "Mobile-only breakage",
    body: "Desktop and mobile renders keep separate baselines so responsive failures do not disappear inside a desktop check.",
  },
  {
    label: "Browser",
    title: "JavaScript and asset failures",
    body: "Console errors, failed scripts, broken images, and incomplete renders become evidence attached to the incident.",
  },
  {
    label: "Visual",
    title: "Meaningful regressions",
    body: "Accepted baselines, ignore regions, and stabilization reduce noise before Witch decides a visual change matters.",
  },
];

const steps = [
  {
    number: "01",
    title: "Check the connection",
    body: "HTTP, TLS, redirects, and latency establish whether the endpoint itself is reachable.",
  },
  {
    number: "02",
    title: "Render the page",
    body: "Paid plans open the page in Chromium on desktop and mobile, stabilize it, and collect DOM, console, asset, and visual signals.",
  },
  {
    number: "03",
    title: "Open useful incidents",
    body: "Witch compares the result with the accepted state, keeps the evidence, and can attach AI analysis when a failure is confirmed.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "Basic availability",
    features: ["1 site", "HTTP + TLS", "30-minute checks", "7-day history", "Public status page"],
  },
  {
    name: "Freelancer",
    price: "$9",
    note: "Browser monitoring",
    features: ["5 sites", "Desktop + mobile Chromium", "Visual baselines", "Email + Discord", "AI incident analysis"],
  },
  {
    name: "Agency",
    price: "$24",
    note: "Client portfolios",
    featured: true,
    features: ["25 sites", "Visual ignore masks", "10 members", "Reports", "90-day history"],
  },
  {
    name: "Agency Pro",
    price: "$49",
    note: "Higher-volume teams",
    features: ["75 sites", "5-minute browser checks", "Priority checks", "180-day history", "25 members"],
  },
];

function ComparisonDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#f0ece5] text-[#181518]">
        <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 text-[10px]">
          <span className="font-medium">Accepted baseline</span>
          <span className="font-mono text-black/35">mobile</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-3 w-20 rounded-full bg-black/10" />
          <div className="mt-7 h-7 w-36 rounded-md bg-black/85" />
          <div className="mt-3 h-3 w-44 max-w-full rounded-full bg-black/10" />
          <div className="mt-1.5 h-3 w-32 rounded-full bg-black/10" />
          <div className="mt-8 space-y-2 rounded-xl bg-white/75 p-4">
            <div className="h-3 w-full rounded-full bg-black/[0.07]" />
            <div className="h-3 w-4/5 rounded-full bg-black/[0.07]" />
          </div>
          <div className="mt-4 flex h-11 items-center justify-center rounded-xl bg-[#211a22] text-[11px] font-semibold text-white">
            Complete purchase
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#d55d75]/25 bg-[#f0ece5] text-[#181518]">
        <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 text-[10px]">
          <span className="font-medium text-[#a63149]">Current render</span>
          <span className="font-mono text-black/35">mobile</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-3 w-20 rounded-full bg-black/10" />
          <div className="mt-7 h-7 w-36 rounded-md bg-black/85" />
          <div className="mt-3 h-3 w-44 max-w-full rounded-full bg-black/10" />
          <div className="mt-1.5 h-3 w-32 rounded-full bg-black/10" />
          <div className="mt-8 space-y-2 rounded-xl bg-white/75 p-4">
            <div className="h-3 w-full rounded-full bg-black/[0.07]" />
            <div className="h-3 w-4/5 rounded-full bg-black/[0.07]" />
          </div>
          <div className="mt-4 flex h-11 items-center justify-center rounded-xl border border-dashed border-[#d55d75]/55 bg-[#d55d75]/5 text-[10px] font-semibold text-[#a63149]">
            Missing from render
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      className={"landing-page " + fontSerif.variable + " " + fontSans.variable + " overflow-x-clip"}
      style={{ backgroundColor: "var(--landing-bg)", color: "var(--landing-text)" }}
    >
      <header className="absolute inset-x-0 top-0 z-50 text-[#f3eef5] safe-area-top">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Witch home" className="inline-flex min-h-11 items-center text-[#f3eef5]">
            <Wordmark className="text-[#f3eef5]" />
          </Link>

          <nav aria-label="Primary navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] text-[#d7ccda] lg:flex">
            <a href="#how" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#incident" className="transition-colors hover:text-white">
              Monitoring
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Status pages
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="hidden min-h-11 items-center px-3 text-[13px] text-[#d7ccda] transition-colors hover:text-white sm:inline-flex">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-transparent bg-[var(--landing-accent)] px-4 text-[13px] font-semibold text-white shadow-[0_1px_12px_rgba(242,106,46,.2)] transition-colors hover:bg-[var(--landing-accent-hover)] active:brightness-95"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="witch-hero relative isolate grid place-items-center overflow-hidden text-[#f4eff5]">
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-32 lg:-translate-y-[3vh] lg:px-10">
            <p className="hero-reveal landing-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aaa0b0] sm:text-[12px]">
              Browser monitoring beyond uptime
            </p>
            <h1 className="hero-reveal landing-serif mx-auto mt-5 max-w-[980px] text-[40px] font-medium leading-[0.98] tracking-[-0.045em] text-[#f5f0f6] min-[360px]:text-[43px] min-[390px]:text-[46px] min-[430px]:text-[48px] sm:mt-6 sm:text-[64px] lg:text-[82px]">
              Your site can be online
              <span className="block text-[#d2c3d5]">and completely broken.</span>
            </h1>
            <p className="hero-reveal landing-sans mx-auto mt-6 max-w-[680px] text-[15px] leading-6 text-[#c3b8c7] min-[390px]:text-[16px] sm:mt-7 sm:text-[18px] sm:leading-8">
              Witch watches what users actually receive — from HTTP and TLS to real browser rendering, missing elements, and visual regressions.
            </p>
            <div className="hero-reveal mt-8 sm:mt-9">
              <Link
                href="/signup"
                className="inline-flex min-h-12 w-full max-w-[290px] items-center justify-center rounded-lg border border-transparent bg-[var(--landing-accent)] px-7 text-[14px] font-semibold text-white shadow-[0_1px_12px_rgba(242,106,46,.22)] transition-colors hover:bg-[var(--landing-accent-hover)] active:brightness-95 sm:w-auto sm:max-w-none"
              >
                Monitor your first site
              </Link>
            </div>
            <p className="hero-reveal mt-4 text-[11px] text-[#9c909f] sm:text-[12px]">Free HTTP + TLS monitoring. No credit card.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)] sm:text-[11px]">The gap</p>
            <h2 className="landing-serif mt-3 text-[clamp(2rem,8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em]">
              Green does not mean working.
            </h2>
            <p className="mt-4 text-[15px] leading-6 text-[var(--landing-text-muted)] sm:text-[17px] sm:leading-7">
              A server can answer perfectly while the thing users came to do has vanished. Witch watches the uncomfortable space
              between “the host is alive” and “the product works.”
            </p>
          </div>

          <div className="mt-10 divide-y divide-white/[0.07] sm:mt-14">
            {signals.map((item) => (
              <div key={item.title} className="grid gap-2 py-6 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-8 sm:py-7">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--landing-text-muted)] sm:text-[10px]">{item.label}</p>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-medium sm:text-[19px]">{item.title}</h3>
                  <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[var(--landing-text-muted)] sm:text-[15px]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="incident" className="scroll-mt-16 bg-[#140d18] py-16 text-[#f6f1f7] sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-14">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p className="font-mono text-[9px] uppercase tracking-[.16em] text-white/38 sm:text-[10px]">Detection, not decoration</p>
                <h2 className="landing-serif mt-3 text-[clamp(2rem,8vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.035em]">
                  The page loaded.
                  <span className="block text-[#c8a7d4]">The job did not.</span>
                </h2>
                <p className="mt-5 max-w-xl text-[14px] leading-6 text-white/55 sm:text-[16px] sm:leading-7">
                  Witch compares the accepted render with the current one and keeps the browser evidence beside the incident.
                  No fake customer screenshot is needed to explain what changed.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-2 sm:max-w-md">
                  {[
                    ["HTTP", "200 OK"],
                    ["TLS", "Valid"],
                    ["Viewport", "390px"],
                    ["DOM", "CTA missing"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white/[0.045] px-3 py-3">
                      <p className="font-mono text-[8px] uppercase tracking-[.12em] text-white/30 sm:text-[9px]">{label}</p>
                      <p className="mt-1 text-[11px] font-medium text-white/75 sm:text-[12px]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0">
                <ComparisonDemo />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <Eye className="h-4 w-4 text-[#c8a7d4]" />
                    <p className="mt-3 text-[12px] font-medium">Visual baseline</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/38">Accepted per viewport.</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <CircleAlert className="h-4 w-4 text-[#ed8196]" />
                    <p className="mt-3 text-[12px] font-medium">DOM signal</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/38">Expected element missing.</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <ShieldCheck className="h-4 w-4 text-[#75d39b]" />
                    <p className="mt-3 text-[12px] font-medium">Network healthy</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/38">Endpoint itself stayed up.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-14">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">How it works</p>
              <h2 className="landing-serif mt-3 text-[clamp(2rem,8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em]">
                Three layers.
                <span className="block text-[var(--landing-text-muted)]">One incident timeline.</span>
              </h2>
            </div>
            <ol className="divide-y divide-white/[0.07]">
              {steps.map((step) => (
                <li key={step.number} className="grid gap-2 py-6 first:pt-0 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5">
                  <span className="font-mono text-[9px] text-[var(--landing-text-muted)] sm:text-[10px]">{step.number}</span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-medium sm:text-[19px]">{step.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-6 text-[var(--landing-text-muted)] sm:text-[15px] sm:leading-7">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
          <div className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-5 sm:rounded-[28px] sm:p-8 lg:p-12">
            <div className="grid gap-9 lg:grid-cols-[1fr_.9fr] lg:items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">For client work</p>
                <h2 className="landing-serif mt-3 text-[clamp(2rem,8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em]">
                  Make invisible maintenance visible.
                </h2>
                <p className="mt-4 max-w-xl text-[14px] leading-6 text-[var(--landing-text-muted)] sm:text-[16px] sm:leading-7">
                  Checks, incidents, recoveries, and visual evidence live in one history. Agency plans add teams, longer retention,
                  and reports you can print or save as PDF.
                </p>
              </div>

              <div className="min-w-0 bg-[#f1ede6] p-4 text-[#191618] sm:p-6">
                <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-4">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[.14em] text-black/40 sm:text-[9px]">Reliability report</p>
                    <h3 className="mt-1 truncate text-[14px] font-semibold sm:text-[16px]">Client workspace</h3>
                  </div>
                  <span className="shrink-0 font-mono text-[8px] text-black/35 sm:text-[9px]">30 days</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["HTTP uptime", "99.98%"],
                    ["Browser checks", "1,284"],
                    ["Incidents", "3"],
                    ["Recovered", "3"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-t border-black/10 pt-3">
                      <p className="text-[9px] text-black/40 sm:text-[10px]">{label}</p>
                      <p className="mt-1 font-mono text-[16px] font-medium sm:text-[18px]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-1">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={i}
                      className={"h-7 flex-1 rounded-[2px] " + (i === 11 ? "bg-[#d6a047]" : i === 12 ? "bg-[#c9596d]" : "bg-[#4e956d]")}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[8px] text-black/35">Example layout using the same metrics Witch stores for reports.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">Pricing</p>
            <h2 className="landing-serif mt-3 text-[clamp(2rem,8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em]">
              Start with availability. Add the browser when it matters.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-white/[0.07] border-y border-white/[0.07] sm:mt-14">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  "grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-start lg:grid-cols-[150px_100px_minmax(0,1fr)_auto] lg:items-center lg:gap-8 " +
                  (plan.featured ? "bg-white/[0.025] -mx-3 px-3 sm:-mx-5 sm:px-5" : "")
                }
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-medium">{plan.name}</h3>
                    {plan.featured ? (
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[8px] uppercase tracking-[.1em] text-[var(--landing-text-muted)]">popular</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--landing-text-muted)]">{plan.note}</p>
                </div>

                <p className="text-3xl font-medium tracking-tight sm:text-right lg:text-left">
                  {plan.price}
                  {plan.price !== "$0" ? <span className="ml-1 text-[10px] font-normal text-[var(--landing-text-muted)]">/mo</span> : null}
                </p>

                <ul className="grid gap-2 text-[12px] text-[var(--landing-text-muted)] sm:col-span-2 sm:grid-cols-2 lg:col-span-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex min-w-0 items-center gap-2">
                      <Check className="h-3 w-3 shrink-0 opacity-55" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={
                    "inline-flex min-h-10 w-full items-center justify-center rounded-md border px-5 text-[12px] font-semibold transition-colors sm:col-span-2 lg:col-span-1 lg:w-auto " +
                    (plan.featured
                      ? "border-transparent bg-[var(--landing-accent)] text-white shadow-[0_1px_12px_rgba(242,106,46,.18)] hover:bg-[var(--landing-accent-hover)]"
                      : "border-[var(--landing-border)] bg-[var(--landing-surface-raised)] text-[var(--landing-text)] hover:border-[var(--landing-border-strong)] hover:bg-[var(--landing-surface)]")
                  }
                >
                  {plan.price === "$0" ? "Start free" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex items-center gap-2 text-[var(--landing-text-muted)]">
            <Globe2 className="h-4 w-4" />
            <span className="font-mono text-[9px] uppercase tracking-[.15em]">Questions</span>
          </div>
          <div className="mt-8 divide-y divide-white/[0.07]">
            {[
              ["How is this different from an uptime monitor?", "Uptime checks whether an endpoint answers. Witch can also render the page, compare accepted visual state, inspect expected elements, and collect browser errors."],
              ["Will it hammer my website?", "No. Checks use plan-based intervals, jitter, concurrency limits, request caps, and byte budgets. Witch observes a page, it is not a crawler."],
              ["What happens when something breaks?", "The failed signals and evidence are kept with the incident. Recovery requires healthy checks before the incident closes."],
            ].map(([q, a]) => (
              <div key={q} className="py-6">
                <h3 className="text-[16px] font-medium sm:text-[18px]">{q}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[var(--landing-text-muted)] sm:text-[15px] sm:leading-7">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-24 pt-12 text-center sm:px-6 sm:pb-32 sm:pt-20">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--landing-text-muted)]">The server is not the product.</p>
          <h2 className="landing-serif mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,9vw,4.1rem)] font-medium leading-[1.02] tracking-[-0.04em]">
            Know when the page stops doing its job.
          </h2>
          <Link
            href="/signup"
            className="mt-7 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-lg border border-transparent bg-[var(--landing-accent)] px-7 text-[14px] font-semibold text-white shadow-[0_1px_12px_rgba(242,106,46,.2)] transition-colors hover:bg-[var(--landing-accent-hover)] active:brightness-95 sm:w-auto"
          >
            Start monitoring
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-[12px] text-[var(--landing-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <Link href="/" aria-label="Witch home" className="text-[var(--landing-text)]">
            <Wordmark />
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
