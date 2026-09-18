import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { Wordmark } from "@/components/logo";
import {
  MousePointerClick,
  Smartphone,
  Code2,
  ImageOff,
  ArrowRight,
  Check,
} from "lucide-react";

const catches = [
  {
    icon: MousePointerClick,
    title: "Missing checkout button",
    body: "Checkout, signup, or booking buttons disappear after a deploy while the server still answers 200.",
  },
  {
    icon: Smartphone,
    title: "Broken mobile layout",
    body: "Desktop looks fine. On a phone, navigation is pushed off-screen or a banner covers the page.",
  },
  {
    icon: Code2,
    title: "JavaScript failures",
    body: "The origin is healthy, but client-side rendering crashes and leaves a blank or incomplete page.",
  },
  {
    icon: ImageOff,
    title: "Visual regressions",
    body: "A hero image 404s from the CDN, a section shifts, or a form submit control is gone.",
  },
];

const steps = [
  {
    n: "01",
    title: "Witch checks the page",
    body: "HTTP and TLS on every plan. Freelancer and above also open the URL in Chromium, like a visitor would.",
  },
  {
    n: "02",
    title: "Witch compares what changed",
    body: "Screenshots, DOM, and console errors against an accepted baseline — not just the status code.",
  },
  {
    n: "03",
    title: "Witch tells you what matters",
    body: "An incident opens with evidence. AI analysis on paid plans explains the failure when there is something to analyze.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "HTTP monitoring for one public site.",
    features: [
      "1 site",
      "HTTP, TLS, and latency",
      "30-minute interval",
      "7-day history",
      "Public status page",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Freelancer",
    price: "$9",
    period: "per month",
    description: "Browser checks and visual diffs for a handful of sites.",
    features: [
      "5 sites",
      "Chromium on desktop and mobile",
      "Visual baselines",
      "Email and Discord alerts",
      "AI incident analysis",
      "Printable monthly reports",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$24",
    period: "per month",
    description: "Client portfolios and a small team.",
    features: [
      "25 sites",
      "Visual diffs with ignore masks",
      "Up to 10 members",
      "Alerts and reports",
      "90-day history",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Agency Pro",
    price: "$49",
    period: "per month",
    description: "Higher limits, priority checks, longer history.",
    features: [
      "75 sites",
      "Priority check jitter",
      "180-day history",
      "Advanced reporting",
      "Up to 25 members",
    ],
    cta: "Get started",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How is this different from uptime monitoring?",
    a: "Uptime monitors ping an endpoint. If it returns HTTP 200, they stay green — even if checkout is missing, JavaScript crashed, or the mobile layout collapsed. Witch still runs HTTP and TLS. On Freelancer and above it also loads the page in Chromium and compares what actually rendered.",
  },
  {
    q: "Will Witch slow down my site?",
    a: "Checks use jitter and concurrency limits. Each browser job loads a single page and aborts oversized or excessive resource fetches. Visitors never share a session with the monitor.",
  },
  {
    q: "What happens when Witch detects a problem?",
    a: "An incident opens with evidence from the check. Paid plans can send email or Discord alerts, and AI analysis can summarize the failure when there is real evidence. After the page recovers, Witch marks the incident resolved.",
  },
  {
    q: "Does Witch work on mobile layouts?",
    a: "Yes. Paid plans capture both a 390px mobile viewport and a 1440px desktop viewport, then compare each against its own baseline.",
  },
  {
    q: "Can I use it for client websites?",
    a: "That is the Agency use case. Watch multiple client sites, keep a record of incidents and recoveries, and print a monthly summary from the browser — no server-side PDF generator.",
  },
];

function StorePreview({ broken }: { broken: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[#101014]">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="font-mono text-[10px] text-[var(--text-faint)]">9:41</span>
        <span className="h-1 w-8 rounded-full bg-white/15" />
        <span className="font-mono text-[10px] text-[var(--text-faint)]">LTE</span>
      </div>
      <div className="px-4 pb-4 pt-2">
        <p className="font-mono text-[10px] text-[var(--text-faint)]">store.example.com</p>
        <p className="mt-3 text-[11px] text-[var(--text-faint)]">Northwind Store</p>
        <p className="mt-1 text-[15px] font-medium leading-snug">Merino wool coat</p>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">$248 · Size M</p>
        <div className="mt-3 h-[104px] overflow-hidden rounded-lg bg-[#16161c]">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,rgba(187,242,176,0.08),transparent_62%)]" />
        </div>
        {broken ? (
          <div className="mt-4 rounded-md border border-dashed border-[var(--critical)]/40 bg-[var(--critical-dim)] px-3 py-2.5 text-center text-[11px] text-[var(--critical)]">
            Checkout missing
          </div>
        ) : (
          <div className="mt-4 rounded-md bg-[var(--accent)] px-3 py-2.5 text-center text-[11px] font-semibold text-[var(--accent-foreground)]">
            Checkout
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="landing-atmosphere" aria-hidden>
        <Image
          src="/header-landing.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-[0.58]"
        />
        <span className="landing-star left-[12%] top-[18%] [animation-delay:0s]" />
        <span className="landing-star right-[14%] top-[22%] [animation-delay:2.4s]" />
        <span className="landing-star left-[22%] top-[48%] [animation-delay:4.1s]" />
      </div>

      <div className="relative z-10">
        <SiteHeader current="home" />

        <main>
          <section className="mx-auto max-w-3xl px-5 sm:px-8 pt-[72px] pb-14 sm:pt-[120px] sm:pb-24 text-center">
            <p className="text-[13px] tracking-wide text-[var(--accent)]">Beyond uptime</p>
            <h1 className="mt-5 text-[2rem] sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.12] text-[var(--text)]">
              Uptime tells you the server is online.
              <span className="mt-2 block text-[var(--accent)]">Witch tells you if it actually works.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[16px] sm:text-[17px] leading-[1.7] text-[var(--text-muted)]">
              Most monitors stop at HTTP 200. Witch opens the page like a visitor and warns you when
              buttons disappear, layouts break, or JavaScript fails.
            </p>
            <div className="mt-10 flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-strong)]"
              >
                Start monitoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg border border-white/[0.08] px-6 text-[14px] text-[var(--text)] transition-colors hover:bg-white/[0.04]"
              >
                See an incident
              </a>
            </div>
            <p className="mt-5 text-[13px] text-[var(--text-faint)]">
              Free HTTP monitoring. No credit card.
            </p>
          </section>

          <section id="demo" className="mx-auto max-w-5xl px-5 sm:px-8 pt-8 pb-24 scroll-mt-20">
            <p className="text-[13px] text-[var(--text-faint)]">A deploy, twenty minutes later</p>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              HTTP 200. Checkout broken.
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-[var(--text-muted)]">
              The server is healthy. On a phone, the checkout button is gone. Witch checks the
              rendered page, not just the response code.
            </p>

            <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/80">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.06] px-5 py-3">
                <span className="font-mono text-[12px] text-[var(--text-faint)]">HTTP 200</span>
                <span className="text-[12px] text-[var(--critical)]">Checkout button missing</span>
                <span className="text-[12px] text-[var(--text-faint)]">Mobile · 390px</span>
              </div>
              <div className="grid gap-8 px-5 py-8 sm:grid-cols-2 sm:px-8">
                <figure>
                  <figcaption className="mb-3 text-[12px] text-[var(--text-faint)]">Before</figcaption>
                  <StorePreview broken={false} />
                </figure>
                <figure>
                  <figcaption className="mb-3 text-[12px] text-[var(--text-faint)]">After the deploy</figcaption>
                  <StorePreview broken={true} />
                </figure>
              </div>
              <div className="border-t border-white/[0.06] px-5 py-6 sm:px-8">
                <ul className="max-w-xl space-y-3 text-[15px] leading-relaxed text-[var(--text-muted)]">
                  <li>
                    <span className="text-[var(--text)]">Witch noticed</span> — checkout CTA disappeared,
                    a JavaScript error on mobile, viewport 390px.
                  </li>
                  <li>
                    <span className="text-[var(--text)]">Likely cause</span> — checkout bundle failed
                    after deploy.
                  </li>
                  <li>
                    <span className="text-[var(--text)]">Action</span> — incident opened automatically,
                    with the screenshot and console evidence.
                  </li>
                </ul>
                <p className="mt-4 font-mono text-[12px] text-[var(--text-faint)]">
                  HTTP 200 · Checkout button missing · Recovered
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-5 sm:px-8 py-24 border-t border-white/[0.06]">
            <h2 className="max-w-xl text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              What Witch catches that uptime monitors don&apos;t
            </h2>
            <div className="mt-14 space-y-12">
              {catches.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-8 sm:items-start">
                    <Icon className="mt-1 h-5 w-5 text-[var(--accent)]" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-[18px] font-medium text-[var(--text)]">{item.title}</h3>
                      <p className="mt-2 max-w-xl text-[15px] leading-[1.7] text-[var(--text-muted)]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="how" className="mx-auto max-w-5xl px-5 sm:px-8 py-24 border-t border-white/[0.06] scroll-mt-20">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">How Witch watches</h2>
            <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-[var(--text-muted)]">
              HTTP on every plan. Browser rendering, visual diffs, and AI analysis require Freelancer
              or above.
            </p>
            <ol className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
              {steps.map((step) => (
                <li key={step.n}>
                  <p className="font-mono text-[12px] text-[var(--accent)]">{step.n}</p>
                  <h3 className="mt-3 text-[17px] font-medium">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[var(--text-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mx-auto max-w-5xl px-5 sm:px-8 py-24 border-t border-white/[0.06]">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                  Turn invisible maintenance into something clients can see.
                </h2>
                <p className="mt-5 text-[16px] leading-[1.7] text-[var(--text-muted)]">
                  Witch gives agencies a simple record of uptime, incidents, recoveries, and visual
                  changes — so monthly maintenance isn&apos;t just “trust us, everything worked.”
                </p>
                <p className="mt-4 text-[14px] leading-[1.7] text-[var(--text-faint)]">
                  Open the report in the app and print or save as PDF from your browser.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)]/80 p-6 sm:p-8">
                <p className="text-[13px] text-[var(--text-faint)]">August · Northwind Store</p>
                <p className="mt-2 text-[15px] font-medium">Monthly summary</p>
                <dl className="mt-6 space-y-3 text-[14px]">
                  <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="text-[var(--text-muted)]">Incidents caught</dt>
                    <dd>Checkout missing on mobile</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="text-[var(--text-muted)]">Recovered</dt>
                    <dd>Same day</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="text-[var(--text-muted)]">Uptime</dt>
                    <dd>Healthy</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--text-muted)]">Visual issues</dt>
                    <dd>1, resolved</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section id="pricing" className="mx-auto max-w-6xl px-5 sm:px-8 py-24 border-t border-white/[0.06] scroll-mt-20">
            <h2 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight">Plans</h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-[16px] leading-[1.7] text-[var(--text-muted)]">
              Start with free HTTP monitoring. Upgrade when you need Chromium, visuals, and alerts.
            </p>
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-white/[0.12] bg-[var(--bg-elevated)]"
                      : "border-white/[0.06] bg-transparent"
                  }`}
                >
                  {plan.highlight ? (
                    <p className="mb-3 h-4 text-[11px] tracking-wide text-[var(--accent)]">Most popular</p>
                  ) : (
                    <div className="mb-3 h-4" aria-hidden />
                  )}
                  <p className="text-[16px] font-medium">{plan.name}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {plan.price}
                    <span className="ml-1 text-[13px] font-normal text-[var(--text-muted)]">
                      /{plan.period}
                    </span>
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
                    {plan.description}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-2 text-[13px] text-[var(--text)]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-medium transition-colors ${
                      plan.highlight
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
                        : "border border-white/[0.08] hover:bg-white/[0.04]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-2xl px-5 sm:px-8 py-24 border-t border-white/[0.06]">
            <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-12 space-y-10">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-[17px] font-medium">{faq.q}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-[var(--text-muted)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-3xl px-5 sm:px-8 py-24 text-center border-t border-white/[0.06]">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Know before your client does.</h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-[1.7] text-[var(--text-muted)]">
              Add your first site and let Witch start watching.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[var(--accent)] px-7 text-[14px] font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-strong)]"
            >
              Start monitoring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8 text-[13px] text-[var(--text-muted)]">
            <Wordmark />
            <div className="flex items-center gap-6">
              <Link href="/#how" className="hover:text-[var(--text)]">
                How it works
              </Link>
              <Link href="/#pricing" className="hover:text-[var(--text)]">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-[var(--text)]">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
