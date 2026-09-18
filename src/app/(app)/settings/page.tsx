import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, alertChannels, organizations, sessions, subscriptions } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import {
  Button,
  Input,
  Label,
  Select,
  SwitchRow,
  Tabs,
  Badge,
} from "@/components/ui";
import {
  actionChangePassword,
  actionCheckout,
  actionCreateWorkspace,
  actionPortal,
  actionRevokeKey,
  actionRevokeSession,
  actionDeleteAccount,
  actionUpdateAccount,
  actionRenameWorkspace,
  actionAddDiscordWebhook,
  actionAddEmailChannel,
  actionDeleteAlertChannel,
} from "@/app/actions";
import { PLANS, type PlanId, canUseEmailAlerts } from "@/lib/plans";
import { stripeEnabled } from "@/lib/env";
import { CreateKeyForm } from "@/components/create-key-form";
import { maskDiscordWebhookUrl } from "@/lib/discord";
import {
  Building2,
  Bell,
  Globe,
  CreditCard,
  Key,
  User,
  Trash2,
  ExternalLink,
  Mail,
} from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await requireOrgContext();
  const { tab = "general" } = await searchParams;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.organizationId))
    .limit(1);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, ctx.organizationId))
    .limit(1);

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.organizationId, ctx.organizationId));
  const userSessions = await db.select().from(sessions).where(eq(sessions.userId, ctx.userId));
  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.organizationId, ctx.organizationId));

  const tabItems = [
    { id: "general", label: "General", icon: <Building2 className="h-3.5 w-3.5" />, href: "/settings?tab=general" },
    { id: "notifications", label: "Alerts & Notifications", icon: <Bell className="h-3.5 w-3.5" />, href: "/settings?tab=notifications" },
    { id: "status-page", label: "Status Page", icon: <Globe className="h-3.5 w-3.5" />, href: "/settings?tab=status-page" },
    { id: "billing", label: "Billing & Plans", icon: <CreditCard className="h-3.5 w-3.5" />, href: "/settings?tab=billing" },
    { id: "api", label: "API Keys", icon: <Key className="h-3.5 w-3.5" />, href: "/settings?tab=api" },
    { id: "account", label: "Account & Security", icon: <User className="h-3.5 w-3.5" />, href: "/settings?tab=account" },
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-spectral-fade">
      <PageHeader
        title="Settings"
        description="Configure workspace surveillance parameters, alert destinations, billing, and API tokens."
      />

      {/* HORIZONTAL CATEGORY TABS */}
      <Tabs items={tabItems} activeId={tab} />

      {/* TAB 1: GENERAL */}
      {tab === "general" && (
        <div className="space-y-10 max-w-xl">
          <section className="space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Workspace Configuration
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Primary organization profile and billing contact info.
              </p>
            </div>

            <form action={actionRenameWorkspace} className="space-y-4">
              <div>
                <Label htmlFor="org-name">Workspace Name</Label>
                <Input id="org-name" name="name" defaultValue={org?.name} required />
              </div>

              <div>
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input
                  id="billing-email"
                  name="billingEmail"
                  type="email"
                  defaultValue={org?.billingEmail ?? ""}
                  placeholder="billing@agency.com"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue={org?.timezone ?? "UTC"} />
              </div>

              {/* Hidden preserved notification & status page flags to prevent unintended overwrite */}
              <input type="hidden" name="alertOnIncident" value={org?.alertOnIncident ? "on" : "off"} />
              <input type="hidden" name="alertOnRecovery" value={org?.alertOnRecovery ? "on" : "off"} />
              <input type="hidden" name="monthlyReportsEnabled" value={org?.monthlyReportsEnabled ? "on" : "off"} />
              <input type="hidden" name="minAlertSeverity" value={org?.minAlertSeverity ?? "LOW"} />
              <input type="hidden" name="statusPageEnabled" value={org?.statusPageEnabled ? "on" : "off"} />
              <input type="hidden" name="statusPageSlug" value={org?.statusPageSlug ?? ""} />
              <input type="hidden" name="statusPageHeadline" value={org?.statusPageHeadline ?? ""} />

              <Button type="submit" variant="primary">
                Save workspace
              </Button>
            </form>
          </section>

          {/* CREATE NEW WORKSPACE */}
          <section className="pt-6 border-t border-[var(--border)] space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Create New Workspace
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Organize client domains and monitoring quotas in isolated environments.
              </p>
            </div>

            <form action={actionCreateWorkspace} className="flex flex-col sm:flex-row gap-2.5">
              <Input name="name" placeholder="e.g. Acme Client Services" required className="flex-1" />
              <Button type="submit" variant="secondary">
                Create workspace
              </Button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {tab === "notifications" && (
        <div className="space-y-10 max-w-2xl">
          {/* ALERT RULES */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Alert Triggers
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Define when synthetic checks dispatch alert webhooks and emails.
              </p>
            </div>

            <form action={actionRenameWorkspace} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
              <input type="hidden" name="name" value={org?.name ?? ""} />
              <input type="hidden" name="timezone" value={org?.timezone ?? "UTC"} />
              <input type="hidden" name="billingEmail" value={org?.billingEmail ?? ""} />
              <input type="hidden" name="statusPageEnabled" value={org?.statusPageEnabled ? "on" : "off"} />
              <input type="hidden" name="statusPageSlug" value={org?.statusPageSlug ?? ""} />
              <input type="hidden" name="statusPageHeadline" value={org?.statusPageHeadline ?? ""} />

              <div className="divide-y divide-[var(--border)]">
                <SwitchRow
                  title="Incident Alerts"
                  description="Receive instant alerts when a site fails synthetic HTTP or visual regression checks."
                  name="alertOnIncident"
                  defaultChecked={org?.alertOnIncident}
                />
                <SwitchRow
                  title="Recovery Alerts"
                  description="Receive a notification as soon as an active incident resolves and baseline is restored."
                  name="alertOnRecovery"
                  defaultChecked={org?.alertOnRecovery}
                />
                <SwitchRow
                  title="Monthly Digest Reports"
                  description="Receive automated executive summaries of uptime SLA and incident counts."
                  name="monthlyReportsEnabled"
                  defaultChecked={org?.monthlyReportsEnabled}
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <Label htmlFor="minAlertSeverity">Minimum Alert Severity</Label>
                <div className="w-48">
                  <Select
                    id="minAlertSeverity"
                    name="minAlertSeverity"
                    defaultValue={org?.minAlertSeverity ?? "LOW"}
                  >
                    {["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save notification triggers
                </Button>
              </div>
            </form>
          </section>

          {/* DISCORD DESTINATIONS */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Discord Webhooks
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Post incident alerts directly into your agency Discord server.
              </p>
            </div>

            {canUseEmailAlerts(ctx.plan.id) ? (
              <div className="space-y-4">
                <form action={actionAddDiscordWebhook} className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    name="webhookUrl"
                    placeholder="https://discord.com/api/webhooks/…"
                    className="flex-1 mono text-[12px]"
                    required
                  />
                  <Button type="submit" variant="secondary">
                    Add webhook
                  </Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
                  {channels.filter((c) => c.type === "DISCORD_WEBHOOK").length === 0 ? (
                    <div className="p-4 text-[13px] text-[var(--text-muted)] text-center">
                      No Discord webhooks configured.
                    </div>
                  ) : (
                    channels
                      .filter((c) => c.type === "DISCORD_WEBHOOK")
                      .map((channel) => (
                        <div key={channel.id} className="p-3.5 px-4 flex items-center justify-between gap-4">
                          <span className="mono text-[12px] text-[var(--text)] truncate">
                            {maskDiscordWebhookUrl(channel.destination)}
                          </span>
                          <form action={actionDeleteAlertChannel.bind(null, channel.id)}>
                            <Button variant="ghost" size="sm" className="text-[var(--critical)] hover:text-[var(--critical)]">
                              Remove
                            </Button>
                          </form>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[13px] text-[var(--text-muted)]">
                Discord webhook alerts require the Freelancer plan or above.
              </div>
            )}
          </section>

          {/* EMAIL DESTINATIONS */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Email Destinations
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Dispatch alerts to on-call developers or agency distribution lists.
              </p>
            </div>

            {canUseEmailAlerts(ctx.plan.id) ? (
              <div className="space-y-4">
                <form action={actionAddEmailChannel} className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    name="email"
                    type="email"
                    placeholder="devs@agency.com"
                    className="flex-1"
                    required
                    leadingIcon={<Mail className="h-4 w-4" />}
                  />
                  <Button type="submit" variant="secondary">
                    Add email destination
                  </Button>
                </form>

                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
                  {channels.filter((c) => c.type === "EMAIL").length === 0 ? (
                    <div className="p-4 text-[13px] text-[var(--text-muted)] text-center">
                      No email destinations configured.
                    </div>
                  ) : (
                    channels
                      .filter((c) => c.type === "EMAIL")
                      .map((channel) => (
                        <div key={channel.id} className="p-3.5 px-4 flex items-center justify-between gap-4">
                          <span className="text-[13px] text-[var(--text)]">
                            {channel.destination}
                          </span>
                          <form action={actionDeleteAlertChannel.bind(null, channel.id)}>
                            <Button variant="ghost" size="sm" className="text-[var(--critical)] hover:text-[var(--critical)]">
                              Remove
                            </Button>
                          </form>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[13px] text-[var(--text-muted)]">
                Dedicated email alert routing requires the Freelancer plan or above.
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: STATUS PAGE */}
      {tab === "status-page" && (
        <div className="space-y-6 max-w-xl">
          <div>
            <h2 className="text-[15px] font-medium text-[var(--text)]">
              Public Status Portal
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Publish a branded status portal communicating real-time uptime to clients and users.
            </p>
          </div>

          <form action={actionRenameWorkspace} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-5">
            <input type="hidden" name="name" value={org?.name ?? ""} />
            <input type="hidden" name="timezone" value={org?.timezone ?? "UTC"} />
            <input type="hidden" name="billingEmail" value={org?.billingEmail ?? ""} />
            <input type="hidden" name="alertOnIncident" value={org?.alertOnIncident ? "on" : "off"} />
            <input type="hidden" name="alertOnRecovery" value={org?.alertOnRecovery ? "on" : "off"} />
            <input type="hidden" name="monthlyReportsEnabled" value={org?.monthlyReportsEnabled ? "on" : "off"} />
            <input type="hidden" name="minAlertSeverity" value={org?.minAlertSeverity ?? "LOW"} />

            <SwitchRow
              title="Enable Public Status Page"
              description="Make your status portal publicly accessible without authentication."
              name="statusPageEnabled"
              defaultChecked={org?.statusPageEnabled}
            />

            <div>
              <Label htmlFor="statusPageSlug">Portal URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="mono text-[12px] text-[var(--text-muted)]">witch.pw/status/</span>
                <Input
                  id="statusPageSlug"
                  name="statusPageSlug"
                  defaultValue={org?.statusPageSlug ?? ""}
                  placeholder="agency-name"
                  className="mono text-[13px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="statusPageHeadline">Custom Headline</Label>
              <Input
                id="statusPageHeadline"
                name="statusPageHeadline"
                defaultValue={org?.statusPageHeadline ?? ""}
                placeholder="All Systems Operational"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button type="submit" variant="primary">
                Save status page
              </Button>

              {org?.statusPageEnabled && org.statusPageSlug && (
                <Link
                  href={`/status/${org.statusPageSlug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[var(--accent)] hover:underline"
                >
                  <span>View live portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: BILLING & PLANS */}
      {tab === "billing" && (
        <div className="space-y-8 max-w-3xl">
          {/* CURRENT SUBSCRIPTION CARD */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-elevated)] space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent)]">
                  Active Subscription
                </span>
                <h3 className="text-2xl font-medium tracking-tight text-[var(--text)] mt-1">
                  {ctx.plan.name} Plan
                </h3>
              </div>
              <Badge variant="accent" className="uppercase mono text-[11px]">
                {sub?.status ?? ctx.subscriptionStatus}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)] text-[13px]">
              <div>
                <div className="text-[var(--text-muted)] text-[12px]">Site Capacity</div>
                <div className="font-medium text-[var(--text)] mt-0.5">{ctx.plan.maxSites} monitored sites</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] text-[12px]">Check Interval</div>
                <div className="font-medium text-[var(--text)] mt-0.5">Down to {ctx.plan.minHttpIntervalSeconds / 60}m</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] text-[12px]">Visual Regression</div>
                <div className="font-medium text-[var(--text)] mt-0.5">
                  {ctx.plan.browserMonitoring ? "Desktop & Mobile active" : "HTTP synthetic only"}
                </div>
              </div>
            </div>

            {stripeEnabled() && sub?.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(sub.status) && (
              <div className="pt-2">
                <form action={actionPortal}>
                  <Button variant="secondary" leadingIcon={<CreditCard className="h-4 w-4" />}>
                    Manage billing in Stripe Customer Portal
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* PLAN COMPARISON & UPGRADE */}
          {stripeEnabled() && (!sub?.stripeSubscriptionId || ["canceled", "incomplete_expired"].includes(sub.status)) && (
            <div className="space-y-4">
              <h3 className="text-[16px] font-medium text-[var(--text)]">
                Available Upgrades
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                {(["freelancer", "agency", "agency_pro"] as PlanId[]).map((planId) => {
                  const p = PLANS[planId];
                  return (
                    <div
                      key={planId}
                      className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="text-[14px] font-medium text-[var(--text)]">{p.name}</div>
                        <div className="text-2xl font-bold text-[var(--text)]">
                          ${p.monthlyPriceUsd}
                          <span className="text-[12px] font-normal text-[var(--text-muted)]">/mo</span>
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                          Up to {p.maxSites} sites, Chromium baselines, alerts, and executive reports.
                        </p>
                      </div>

                      <form action={actionCheckout.bind(null, planId)}>
                        <Button
                          type="submit"
                          variant={planId === "freelancer" ? "primary" : "secondary"}
                          className="w-full"
                        >
                          Upgrade to {p.name}
                        </Button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: API KEYS */}
      {tab === "api" && (
        <div className="space-y-8 max-w-2xl">
          <div>
            <h2 className="text-[15px] font-medium text-[var(--text)]">
              API & Automation Keys
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Programmatically trigger surveillance checks after CI/CD deployments and ingest telemetry.
            </p>
          </div>

          <CreateKeyForm />

          <section className="space-y-3">
            <h3 className="text-[14px] font-medium text-[var(--text-muted)]">
              Active Tokens ({keys.length})
            </h3>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {keys.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[var(--text-muted)]">
                  No API keys generated yet.
                </div>
              ) : (
                keys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[var(--text)]">{key.name}</span>
                        {key.revokedAt && (
                          <Badge variant="critical" className="text-[10px] uppercase">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="mono text-[11px] text-[var(--text-muted)]">
                        Prefix: {key.prefix}… · Created {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {!key.revokedAt && (
                      <form action={actionRevokeKey.bind(null, key.id)}>
                        <Button variant="ghost" size="sm" className="text-[var(--critical)] hover:text-[var(--critical)]">
                          Revoke
                        </Button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 6: ACCOUNT & SECURITY */}
      {tab === "account" && (
        <div className="space-y-10 max-w-xl">
          {/* PROFILE UPDATE */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                User Profile
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Your personal account details across workspaces.
              </p>
            </div>

            <form action={actionUpdateAccount} className="space-y-4">
              <div>
                <Label htmlFor="account-name">Your Full Name</Label>
                <Input id="account-name" name="name" defaultValue={ctx.userName} required />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input value={ctx.userEmail} disabled className="opacity-60 cursor-not-allowed" />
              </div>

              <Button type="submit" variant="secondary">
                Update profile
              </Button>
            </form>
          </section>

          {/* CHANGE PASSWORD */}
          <section className="pt-6 border-t border-[var(--border)] space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Change Password
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Ensure your credentials meet our 10+ character complexity requirement.
              </p>
            </div>

            <form action={actionChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required minLength={10} />
              </div>

              <Button type="submit" variant="secondary">
                Update password
              </Button>
            </form>
          </section>

          {/* ACTIVE SESSIONS */}
          <section className="pt-6 border-t border-[var(--border)] space-y-4">
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text)]">
                Active Browser Sessions ({userSessions.length})
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Devices and browser sessions currently authenticated.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {userSessions.map((session) => (
                <div key={session.id} className="p-3.5 px-4 flex items-center justify-between gap-4 text-[12px]">
                  <div className="mono text-[var(--text)]">
                    {session.ipAddress ?? "Active browser"} · Expires {new Date(session.expiresAt).toLocaleDateString()}
                  </div>
                  <form action={actionRevokeSession.bind(null, session.id)}>
                    <Button variant="ghost" size="sm" className="text-[var(--critical)]">
                      Revoke
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </section>

          {/* DANGER ZONE: DELETE ACCOUNT */}
          <section className="pt-6 border-t border-[rgba(248,113,113,0.2)] space-y-3">
            <h3 className="text-[14px] font-medium text-[var(--critical)]">
              Delete Account
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Permanently close your Witch account. If you own any workspaces, you must transfer ownership or delete them first.
            </p>
            <form action={actionDeleteAccount}>
              <Button variant="danger" leadingIcon={<Trash2 className="h-3.5 w-3.5" />}>
                Delete account
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

