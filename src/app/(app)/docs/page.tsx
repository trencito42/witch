import Link from "next/link";
import {
  Activity,
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Globe,
  KeyRound,
  Layers3,
  Play,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const sections = [
  ["getting-started", "Getting started"],
  ["how-witch-works", "How Witch works"],
  ["sites", "Sites"],
  ["http-monitoring", "HTTP & TLS monitoring"],
  ["browser-visual", "Browser & visual monitoring"],
  ["incidents", "Incidents"],
  ["alerts", "Alerts & notifications"],
  ["status-pages", "Public status pages"],
  ["reports", "Reports"],
  ["team-workspaces", "Team & workspaces"],
  ["plans", "Plans & limits"],
  ["api-keys", "API keys"],
  ["security", "Security & privacy"],
  ["troubleshooting", "Troubleshooting"],
  ["faq", "FAQ"],
] as const;

function DocsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[var(--border)] pt-9 first:border-t-0 first:pt-0">
      <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      <div className="mt-5 space-y-5 text-[14px] leading-6 text-[var(--text-muted)]">
        {children}
      </div>
    </section>
  );
}

function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5">
      <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
      <div className="mt-1.5 text-[13px] leading-5 text-[var(--text-muted)]">{children}</div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[11px] font-semibold text-[var(--accent)]">
        {number}
      </div>
      <div>
        <div className="font-medium text-[var(--text)]">{title}</div>
        <div className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">{children}</div>
      </div>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--text)]">
      {children}
    </code>
  );
}

export default function DocsPage() {
  return (
    <div className="animate-spectral-fade">
      <PageHeader
        title="Documentation"
        description="A practical guide to monitoring sites, reviewing evidence, handling incidents, and managing a Witch workspace."
      />

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-1" aria-label="Documentation sections">
            <div className="mb-3 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              <BookOpen className="h-3.5 w-3.5" />
              Guide
            </div>
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={"#" + id}
                className="block rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-4xl space-y-12 pb-16">
          <DocsSection
            id="getting-started"
            title="Getting started"
            description="Witch starts with a public website URL. Free workspaces receive HTTP/TLS monitoring; paid plans add Chromium rendering, visual baselines, alerts, reports, and other browser-level signals."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="What you can monitor">
                Publicly reachable HTTP or HTTPS websites. Witch rejects private/internal destinations as part of its SSRF protections.
              </Callout>
              <Callout title="What Witch does not need">
                Witch does not use your dashboard cookies when it monitors a site. Monitoring runs separately from your signed-in Witch session.
              </Callout>
            </div>

            <div className="space-y-4">
              <Step number="1" title="Add a site">
                Open <Link href="/sites" className="prose-link">Sites</Link> and choose <strong className="text-[var(--text)]">Add site</strong>. Enter the public URL you want Witch to watch.
              </Step>
              <Step number="2" title="Wait for the first checks">
                Witch creates HTTP monitoring immediately. On plans with browser monitoring, desktop and mobile Chromium checks are also queued and initial visual baselines are created.
              </Step>
              <Step number="3" title="Review the site">
                Open the site detail page to inspect live status, telemetry, visual baselines, surveillance rules, incidents, check history, and site-specific settings.
              </Step>
              <Step number="4" title="Run a manual check after a deploy">
                Use <strong className="text-[var(--text)]">Run check</strong> when you want fresh evidence immediately. Manual checks have a 60-second cooldown to prevent accidental request storms.
              </Step>
            </div>
          </DocsSection>

          <DocsSection
            id="how-witch-works"
            title="How Witch works"
            description="Witch separates basic reachability from what a real browser actually receives. A site can return HTTP 200 and still be broken for users."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Callout title="1. Connection">
                HTTP checks measure reachability, response status, latency, redirects, TLS validity, and related endpoint health.
              </Callout>
              <Callout title="2. Browser render">
                On supported plans, Chromium renders the site in isolated browser contexts and collects browser, DOM, asset, and visual evidence.
              </Callout>
              <Callout title="3. Incident">
                Deterministic monitoring signals are classified into incidents. Visual evidence and AI analysis can be attached after an incident exists.
              </Callout>
            </div>

            <p>
              The scheduler queues due monitors with jitter, and the worker processes HTTP checks, browser checks, AI analysis, alert delivery, monthly reports, and screenshot-retention jobs. Monitoring state and incident history are stored per workspace.
            </p>
          </DocsSection>

          <DocsSection
            id="sites"
            title="Sites"
            description="A site is the main monitored object inside a Witch workspace."
          >
            <p>
              The Sites view shows each monitored service, its current state, latest telemetry, and open incident count. Filters can narrow the list to healthy services, issues, or paused services.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="Pause a site">
                Pausing stops scheduled surveillance for that site without deleting its history. Plan enforcement can also pause sites that exceed the current site allowance after a downgrade.
              </Callout>
              <Callout title="Delete a site">
                Site deletion is destructive. Surveillance and alerts stop and the site's related data is removed according to the application's cascading data rules.
              </Callout>
            </div>

            <p>
              Each site detail page contains six areas: <strong className="text-[var(--text)]">Overview</strong>, <strong className="text-[var(--text)]">Visual Baselines</strong>, <strong className="text-[var(--text)]">Surveillance</strong>, <strong className="text-[var(--text)]">Incidents</strong>, <strong className="text-[var(--text)]">Check Log</strong>, and <strong className="text-[var(--text)]">Settings</strong>.
            </p>
          </DocsSection>

          <DocsSection
            id="http-monitoring"
            title="HTTP & TLS monitoring"
            description="HTTP monitoring is available on every plan, including Free."
          >
            <p>
              HTTP checks are the base availability layer. They record whether the request completed successfully, response status, latency, final URL, resolved IP, TLS validity, TLS expiry where available, and error information when a check fails.
            </p>

            <Callout title="Status is not based on one cosmetic signal">
              Witch uses confirmed monitoring state rather than treating every transient request as a permanent outage. Recovery also requires healthy checks before an incident closes. The exact confirmation values are deployment configuration, so the UI should be treated as the source of truth for the current incident state.
            </Callout>

            <p>
              Plan minimum HTTP intervals are listed in <a href="#plans" className="prose-link">Plans & limits</a>. The Free plan checks no more frequently than every 30 minutes; paid plans allow 5-minute HTTP intervals.
            </p>
          </DocsSection>

          <DocsSection
            id="browser-visual"
            title="Browser & visual monitoring"
            description="Freelancer and higher plans can render pages in Chromium, capture desktop/mobile views, compare them with accepted baselines, and detect meaningful browser-side failures."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="Desktop and mobile">
                Witch can maintain separate desktop and mobile browser monitoring so responsive failures do not disappear inside a desktop-only check.
              </Callout>
              <Callout title="Accepted baseline">
                A baseline is the approved visual state used for comparison. Accepting a new baseline changes the reference image without deleting the historical evidence that led to the change.
              </Callout>
            </div>

            <h3 className="pt-2 text-[15px] font-semibold text-[var(--text)]">Visual sensitivity</h3>
            <p>
              Site settings offer <strong className="text-[var(--text)]">Low</strong>, <strong className="text-[var(--text)]">Medium</strong>, and <strong className="text-[var(--text)]">High</strong> visual sensitivity. Medium is the default. Low tolerates more minor pixel/font movement; High is intended for stricter comparison.
            </p>

            <h3 className="pt-2 text-[15px] font-semibold text-[var(--text)]">Noise controls</h3>
            <p>
              Visual monitoring can exclude or clean common sources of non-product noise. Current controls include cookie-consent banners, chat widgets, marketing popups, ad containers, sticky promotional bars, custom ignore selectors, clean-capture mode, automatic consent dismissal, and an emulated light/dark/default color scheme.
            </p>

            <Callout title="Default noise behavior">
              Cookie-consent banners and chat widgets are ignored by default. Marketing popups, ads, sticky promotional bars, clean capture, and automatic consent dismissal are opt-in unless changed in site settings.
            </Callout>

            <h3 className="pt-2 text-[15px] font-semibold text-[var(--text)]">Element surveillance</h3>
            <p>
              Browser-enabled plans can add element monitors using a CSS selector, expected text, or both. These are useful for critical controls such as checkout buttons, login forms, booking actions, and other elements that must remain present.
            </p>
          </DocsSection>

          <DocsSection
            id="incidents"
            title="Incidents"
            description="Incidents collect confirmed failures and the evidence needed to understand what changed."
          >
            <p>
              Witch currently surfaces incident types such as HTTP failures or slow responses, page structure/content changes, JavaScript errors, visible asset failures, element failures, and visual regressions. The exact title reflects the deterministic signal that opened the incident.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="Lifecycle">
                Incidents can be Open, Acknowledged, Resolved, or Ignored. Resolved incidents remain part of history; ignored incidents are excluded from public status-page uptime history.
              </Callout>
              <Callout title="Evidence">
                Incident detail can include timing, failed resources, browser/DOM signals, screenshots, visual baseline/current frames, and visual differences where that evidence exists.
              </Callout>
            </div>

            <p>
              Paid plans can receive AI incident analysis after a deterministic incident has been opened. AI is supplementary: it does not replace the underlying monitoring signal that created the incident.
            </p>
          </DocsSection>

          <DocsSection
            id="alerts"
            title="Alerts & notifications"
            description="Freelancer and higher plans can deliver incident and recovery notifications."
          >
            <p>
              Workspace administrators can enable incident alerts, recovery alerts, monthly digest reports, and a minimum alert severity. Delivery destinations can include email addresses and Discord webhooks.
            </p>

            <Callout title="Email delivery">
              Witch supports email delivery through the configured production email provider. Public status-page subscriptions also use email confirmation before a subscriber starts receiving updates.
            </Callout>

            <p>
              When an incident recovers, Witch can send a separate recovery notification. Alert availability follows the workspace's effective plan.
            </p>
          </DocsSection>

          <DocsSection
            id="status-pages"
            title="Public status pages"
            description="A workspace can publish selected monitored sites on a public status portal."
          >
            <p>
              In <Link href="/settings?tab=status-page" className="prose-link">Settings → Status Page</Link>, administrators can enable the public page, choose a unique slug, set a custom headline/subheadline, allow visitor subscriptions, and show or hide 90-day uptime history bars.
            </p>

            <p>
              Individual sites must also have <strong className="text-[var(--text)]">Show on public status page</strong> enabled before they appear publicly.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="90-day history">
                Public uptime history is built from real HTTP check data and incident periods. Unknown/no-data days are not silently presented as healthy.
              </Callout>
              <Callout title="Stale monitoring">
                A stale public service is shown as delayed/unknown rather than falsely operational. Paused and unknown services are not treated as healthy.
              </Callout>
            </div>

            <p>
              Visitor subscriptions are available when public subscriptions are enabled and the workspace plan supports email alerts. Subscribers must confirm their email and receive unsubscribe links in subsequent status notifications.
            </p>
          </DocsSection>

          <DocsSection
            id="reports"
            title="Reports"
            description="Freelancer and higher plans receive monthly, client-ready monitoring reports."
          >
            <p>
              Reports are generated automatically for eligible sites for the previous calendar month. Current report metrics include HTTP uptime, number of HTTP checks, detected incidents, resolved incidents, average response time, and the site's current status at generation time.
            </p>

            <p>
              Reports can be opened from <Link href="/reports" className="prose-link">Reports</Link> and are designed to be printed or saved as PDF from the browser. If monthly report emails are enabled and a billing email is configured, Witch can email the generated report link.
            </p>
          </DocsSection>

          <DocsSection
            id="team-workspaces"
            title="Team & workspaces"
            description="A Witch account can belong to one or more isolated workspaces, subject to plan limits."
          >
            <p>
              Workspace data is tenant-isolated. Switching workspace changes the active organization context; sites, incidents, reports, settings, and team membership are scoped to that workspace.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
                <thead className="bg-[var(--surface-raised)] text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">Owner</td>
                    <td className="px-4 py-3">Full workspace control, including ownership transfer and administrative operations.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">Admin</td>
                    <td className="px-4 py-3">Administrative access including team and workspace settings. Owners and Admins can invite members.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">Member</td>
                    <td className="px-4 py-3">Writable workspace access for monitoring workflows, without administrative team privileges.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">Viewer</td>
                    <td className="px-4 py-3">Read-only access.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Callout title="Invitations">
              Team invitations expire after 7 days. An invite is tied to the email address it was sent to and cannot be accepted by a different account email.
            </Callout>
          </DocsSection>

          <DocsSection
            id="plans"
            title="Plans & limits"
            description="These limits are taken from Witch's current plan configuration."
          >
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[900px] border-collapse text-left text-[12px] sm:text-[13px]">
                <thead className="bg-[var(--surface-raised)] text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Plan</th>
                    <th className="px-3 py-3 font-semibold">Price</th>
                    <th className="px-3 py-3 font-semibold">Sites</th>
                    <th className="px-3 py-3 font-semibold">HTTP</th>
                    <th className="px-3 py-3 font-semibold">Browser</th>
                    <th className="px-3 py-3 font-semibold">History</th>
                    <th className="px-3 py-3 font-semibold">Members</th>
                    <th className="px-3 py-3 font-semibold">Workspaces</th>
                    <th className="px-3 py-3 font-semibold">API keys</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="px-3 py-3 font-medium text-[var(--text)]">Free</td>
                    <td className="px-3 py-3">$0/mo</td>
                    <td className="px-3 py-3">1</td>
                    <td className="px-3 py-3">30 min</td>
                    <td className="px-3 py-3">No</td>
                    <td className="px-3 py-3">7 days</td>
                    <td className="px-3 py-3">1</td>
                    <td className="px-3 py-3">1</td>
                    <td className="px-3 py-3">1</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 font-medium text-[var(--text)]">Freelancer</td>
                    <td className="px-3 py-3">$9/mo</td>
                    <td className="px-3 py-3">5</td>
                    <td className="px-3 py-3">5 min</td>
                    <td className="px-3 py-3">15 min</td>
                    <td className="px-3 py-3">30 days</td>
                    <td className="px-3 py-3">2</td>
                    <td className="px-3 py-3">2</td>
                    <td className="px-3 py-3">5</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 font-medium text-[var(--text)]">Agency</td>
                    <td className="px-3 py-3">$24/mo</td>
                    <td className="px-3 py-3">25</td>
                    <td className="px-3 py-3">5 min</td>
                    <td className="px-3 py-3">15 min</td>
                    <td className="px-3 py-3">90 days</td>
                    <td className="px-3 py-3">10</td>
                    <td className="px-3 py-3">5</td>
                    <td className="px-3 py-3">20</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 font-medium text-[var(--text)]">Agency Pro</td>
                    <td className="px-3 py-3">$49/mo</td>
                    <td className="px-3 py-3">75</td>
                    <td className="px-3 py-3">5 min</td>
                    <td className="px-3 py-3">5 min</td>
                    <td className="px-3 py-3">180 days</td>
                    <td className="px-3 py-3">25</td>
                    <td className="px-3 py-3">10</td>
                    <td className="px-3 py-3">50</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Browser monitoring, visual monitoring, email/Discord alerts, and reports start on Freelancer. Agency and Agency Pro enable advanced reporting; Agency Pro also enables priority checks. Subscription entitlements currently remain active for <InlineCode>active</InlineCode>, <InlineCode>trialing</InlineCode>, and <InlineCode>past_due</InlineCode> subscription states.
            </p>

            <Callout title="What happens after a downgrade">
              Witch applies the new plan limits. Sites above the site allowance can be paused, browser monitors can be disabled if the new plan does not include them, and monitor intervals are raised to the minimum allowed by the new plan.
            </Callout>
          </DocsSection>

          <DocsSection
            id="api-keys"
            title="API keys"
            description="Workspace administrators can create and revoke scoped Witch API keys from Settings."
          >
            <p>
              API key allowances are plan-limited. A newly created secret is shown at creation time and can be copied then. Revocation invalidates the stored key.
            </p>

            <Callout title="Current public API status">
              Witch does not expose a general public HTTP API in this release. API keys are provisioned by the product, but this documentation does not invent endpoints that do not currently exist.
            </Callout>
          </DocsSection>

          <DocsSection
            id="security"
            title="Security & privacy"
            description="Witch's monitoring and workspace model includes several protections that matter when reading evidence."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Callout title="Tenant isolation">
                Workspace-owned queries are scoped by organization. Authenticated media routes verify access before serving screenshots.
              </Callout>
              <Callout title="Private targets rejected">
                Monitoring accepts public HTTP(S) destinations. Redirects are revalidated, and private/internal network targets are rejected.
              </Callout>
              <Callout title="Separate browser context">
                Browser monitoring does not reuse your Witch dashboard cookies. Checks run independently in isolated Chromium contexts.
              </Callout>
              <Callout title="Screenshots are not public files">
                Stored monitoring images are served through application routes rather than exposed as a public storage directory.
              </Callout>
            </div>

            <p>
              Public status pages are intentionally public when enabled. Review which sites are marked visible before publishing a status portal.
            </p>
          </DocsSection>

          <DocsSection
            id="troubleshooting"
            title="Troubleshooting"
            description="Common product-level checks before treating something as a monitoring failure."
          >
            <div className="space-y-4">
              <Callout title="The site is online but Witch opened an incident">
                This can be correct. Witch can detect browser-side breakage, missing controls, JavaScript failures, failed visible assets, content/DOM changes, or visual regressions while the origin still returns HTTP 200.
              </Callout>
              <Callout title="A visual change is expected">
                Review the Visual Baselines tab. If the new render is the intended design, accept the current snapshot as the new baseline rather than deleting historical evidence.
              </Callout>
              <Callout title="Cookie banners or chat widgets keep changing">
                Use the visual-noise controls in the site's Settings tab. Cookie-consent and chat-widget masking are already enabled by default unless changed.
              </Callout>
              <Callout title="A check looks delayed">
                Witch explicitly marks stale monitoring rather than silently calling it healthy. Run a manual check and review the Check Log for the latest completed telemetry.
              </Callout>
              <Callout title="I cannot enable browser monitoring">
                Browser and visual monitoring require Freelancer or above. Free workspaces use HTTP/TLS monitoring only.
              </Callout>
              <Callout title="I am not receiving alerts">
                Confirm the workspace is on a plan with alerts, the relevant incident/recovery trigger is enabled, the minimum severity allows the incident, and at least one email or Discord destination is configured.
              </Callout>
            </div>
          </DocsSection>

          <DocsSection
            id="faq"
            title="FAQ"
          >
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-[var(--text)]">How is Witch different from a basic uptime monitor?</h3>
                <p className="mt-1">
                  A basic uptime monitor primarily asks whether an endpoint answers. Witch can also render the page in Chromium, inspect browser/DOM/asset signals, maintain visual baselines, and open incidents when the user-facing page changes or breaks.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Does Witch crawl my entire website?</h3>
                <p className="mt-1">
                  No. A Witch site is a monitored target URL with scheduled checks. The browser opens the configured target for its checks; it is not a general-purpose site crawler.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Will a green HTTP result always mean the page works?</h3>
                <p className="mt-1">
                  No. HTTP reachability and browser correctness are separate signals. That distinction is the core reason browser and visual monitoring exist.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Can I monitor mobile separately?</h3>
                <p className="mt-1">
                  Yes on browser-enabled plans. Witch supports separate desktop and mobile Chromium monitoring and visual baselines.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Can I publish service health to customers?</h3>
                <p className="mt-1">
                  Yes. Enable the workspace status page, choose a public slug, and mark the individual services you want visible.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Can visitors subscribe to public status updates?</h3>
                <p className="mt-1">
                  Yes when public subscriptions are enabled, email delivery is available, and the workspace plan includes alerts. Subscriptions require email confirmation.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text)]">Does AI decide whether my site is broken?</h3>
                <p className="mt-1">
                  No. Deterministic monitoring opens the incident first. AI analysis, when available, is attached afterward to help explain the incident.
                </p>
              </div>
            </div>
          </DocsSection>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-[var(--accent-dim)] p-2 text-[var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--text)]">Documentation accuracy</h2>
                <p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">
                  This guide documents behavior that exists in the current Witch application. It deliberately does not document unshipped endpoints or features as if they were available.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
