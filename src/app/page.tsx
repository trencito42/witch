import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const problems = [
  "Missing checkout button",
  "Broken mobile layout",
  "Failed JavaScript",
  "Missing hero image",
  "Broken form",
];

const checks = [
  { name: "HTTP", detail: "Status, TLS, redirects, latency." },
  { name: "Browser", detail: "Real Chromium, desktop and mobile." },
  { name: "Visual", detail: "Pixel diffs against an accepted baseline." },
  { name: "Elements", detail: "Selectors and CTA text still present." },
  { name: "Diagnosis", detail: "AI only when something actually changed." },
];

const plans = [
  { name: "Free", price: "$0", detail: "1 site, HTTP, 30-minute interval" },
  { name: "Freelancer", price: "$9", detail: "5 sites, browser, alerts, reports" },
  { name: "Agency", price: "$24", detail: "25 sites, team, 90-day history" },
  { name: "Agency Pro", price: "$49", detail: "75 sites, priority, 180-day history" },
];

const faqs = [
  {
    q: "How is this different from uptime monitoring?",
    a: "Uptime checks whether a port answers. Witch loads the page in a browser and looks at layout, assets, scripts, and key elements.",
  },
  {
    q: "Will this hammer my sites?",
    a: "No. Intervals start at 30 minutes on Free, checks are jittered, and manual runs are rate-limited per site.",
  },
  {
    q: "Do I need Stripe or an AI key to start?",
    a: "No. Create an account, add a site, and HTTP monitoring works. Browser, email, and AI analysis turn on when you configure them.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader current="home" />
      <main className="mx-auto max-w-6xl px-5">
        <section className="max-w-3xl pb-16 pt-16 sm:pt-20">
          <p className="mb-5 text-[12px] uppercase tracking-[0.16em] text-[var(--accent)]">
            Website monitoring beyond uptime
          </p>
          <h1 className="text-[40px] font-medium leading-[1.12] tracking-tight sm:text-[48px]">
            Uptime tells you the site is online.
            <br />
            Witch tells you if it still works.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--text-muted)]">
            Witch loads client websites in a real browser, captures screenshots, and
            catches the failures visitors actually see.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-9 items-center bg-[var(--accent)] px-4 text-[13px] font-medium text-[#111]"
            >
              Start monitoring
            </Link>
            <a
              href="#how"
              className="inline-flex h-9 items-center px-3 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              See how it works
            </a>
          </div>
        </section>

        <section className="mb-20 grid border-y border-[var(--border)] md:grid-cols-[240px_1fr]">
          <div className="border-b border-[var(--border)] px-0 py-5 md:border-b-0 md:border-r md:pr-8 md:py-6">
            <div className="mono text-[12px] text-[var(--text-muted)]">checkout.example</div>
            <div className="mt-4 space-y-2 text-[13px]">
              <div className="text-[var(--healthy)]">HTTP 200 · 312 ms</div>
              <div className="text-[var(--critical)]">Mobile CTA missing</div>
              <div className="text-[var(--warning)]">Layout changed 6.4%</div>
            </div>
          </div>
          <div className="py-5 md:py-6 md:pl-8">
            <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Last check
            </div>
            <p className="text-[15px] leading-relaxed">
              The site is responding, but the mobile checkout button is no longer visible.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
              Detected from a 390×844 Chromium session. Baseline still shows the CTA.
            </p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-2 text-[24px] font-medium tracking-tight">
            Your site can be online and still be broken.
          </h2>
          <ul className="mt-6 max-w-xl">
            {problems.map((item) => (
              <li
                key={item}
                className="border-t border-[var(--border)] py-3 text-[14px] text-[var(--text-muted)] last:border-b"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="how" className="mb-20 scroll-mt-16">
          <h2 className="mb-8 text-[24px] font-medium tracking-tight">
            Witch checks what visitors actually see.
          </h2>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {checks.map((item) => (
              <div key={item.name}>
                <div className="mb-2 text-[13px] text-[var(--text)]">{item.name}</div>
                <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 grid items-start gap-10 border-y border-[var(--border)] py-10 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-[24px] font-medium tracking-tight">
              Visual comparison, then language.
            </h2>
            <p className="max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
              Pixel diffs decide whether a change is real. AI is only asked to explain
              incidents that already have evidence.
            </p>
          </div>
          <div className="mono text-[12px] leading-7 text-[var(--text-muted)]">
            <div>difference</div>
            <div className="text-[var(--text)]">6.41% pixels changed</div>
            <div className="text-[var(--warning)]">above medium threshold</div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-3 text-[24px] font-medium tracking-tight">
            Reports agencies can send as-is.
          </h2>
          <p className="max-w-xl text-[14px] leading-relaxed text-[var(--text-muted)]">
            Monthly uptime, incidents, response time, and current status — printable, with
            no marketing filler.
          </p>
        </section>

        <section id="pricing" className="mb-20 scroll-mt-16">
          <h2 className="mb-6 text-[24px] font-medium tracking-tight">Pricing</h2>
          <div className="max-w-2xl">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-[var(--border)] py-4 last:border-b sm:grid-cols-[140px_70px_1fr]"
              >
                <div className="text-[14px]">{plan.name}</div>
                <div className="text-[14px] text-[var(--text-muted)]">{plan.price}</div>
                <div className="col-span-2 text-[13px] text-[var(--text-muted)] sm:col-span-1">
                  {plan.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24 max-w-2xl">
          <h2 className="mb-6 text-[24px] font-medium tracking-tight">FAQ</h2>
          {faqs.map((item) => (
            <div key={item.q} className="border-t border-[var(--border)] py-5 last:border-b">
              <div className="mb-2 text-[14px]">{item.q}</div>
              <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{item.a}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-[12px] text-[var(--text-muted)]">
          <span>Witch</span>
          <span>witch.pw</span>
        </div>
      </footer>
    </div>
  );
}
