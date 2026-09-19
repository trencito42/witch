import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, alertChannels, organizations, sessions, subscriptions } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { getSession } from "@/server/session";
import { parseUserAgent } from "@/lib/user-agent";
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
import { SettingsForm, SaveButton } from "@/components/settings-form";
import {
  actionChangePassword,
  actionCheckout,
  actionCreateWorkspace,
  actionPortal,
  actionRevokeKey,
  actionRevokeSession,
  actionSignOut,
  actionDeleteAccount,
  actionUpdateAccount,
  actionRenameWorkspace,
  actionUpdateAlertSettings,
  actionUpdateStatusPage,
  actionAddDiscordWebhook,
  actionAddEmailChannel,
  actionDeleteAlertChannel,
} from "@/app/actions";
import { PLANS, type PlanId, canUseEmailAlerts } from "@/lib/plans";
import { stripeEnabled } from "@/lib/env";
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
  Laptop,
  Smartphone,
  Tablet,
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

  const [sessionInfo, keys, userSessions, channels] = await Promise.all([
    getSession(),
    db.select().from(apiKeys).where(eq(apiKeys.organizationId, ctx.organizationId)),
    db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, ctx.userId))
      .orderBy(desc(sessions.createdAt)),
    db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.organizationId, ctx.organizationId)),
  ]);
  const currentSessionId = sessionInfo?.session?.id;

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
        description="Workspace, alerts, billing, and account."
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

            <SettingsForm
              action={actionRenameWorkspace}
              successTitle="Workspace updated"
              successDescription="Your workspace profile has been saved."
              className="space-y-4"
            >
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

              <SaveButton label="Save changes" loadingLabel="Saving changes..." className="w-full sm:w-auto" />
            </SettingsForm>
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

            <SettingsForm
              action={actionUpdateAlertSettings}
              successTitle="Alert settings saved"
              successDescription="Your notification preferences have been updated."
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4"
            >

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
                <SaveButton label="Save notification triggers" loadingLabel="Saving triggers..." className="w-full sm:w-auto" />
              </div>
            </SettingsForm>
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
                    className="flex-1 mono"
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

          <SettingsForm
            action={actionUpdateStatusPage}
            successTitle="Status portal saved"
            successDescription="Your status page settings and live portal have been updated."
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-5"
          >

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

            <div>
              <Label htmlFor="statusPageSubheadline">Custom Subheadline / Announcement</Label>
              <Input
                id="statusPageSubheadline"
                name="statusPageSubheadline"
                defaultValue={org?.statusPageSubheadline ?? ""}
                placeholder="Real-time uptime and incident history across all production services."
              />
            </div>

            <SwitchRow
              title="Allow Visitor Subscriptions"
              description="Visitors can subscribe with their email to receive automated incident and recovery notifications."
              name="statusPageAllowSubscribe"
              defaultChecked={org?.statusPageAllowSubscribe ?? true}
            />

            <SwitchRow
              title="Display 90-Day Visual Uptime Bars"
              description="Show interactive 90-day segmented history bars with daily status for each monitored endpoint."
              name="statusPageShowHistoryBars"
              defaultChecked={org?.statusPageShowHistoryBars ?? true}
            />

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <SaveButton label="Save status page" loadingLabel="Saving status page..." className="w-full sm:w-auto" />

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
          </SettingsForm>
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
                  <Button variant="secondary" className="w-full sm:w-auto" leadingIcon={<CreditCard className="h-4 w-4" />}>
                    <span className="sm:hidden">Manage billing</span>
                    <span className="hidden sm:inline">Manage billing in Stripe Customer Portal</span>
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* PLAN COMPARISON & UPGRADE */}
          {/* PLAN COMPARISON & UPGRADE */}
          {!stripeEnabled() && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[13px] text-[var(--text-muted)]">
              Self-serve billing is not configured on this instance. Plans still apply; contact the
              operator to change them.
            </div>
          )}
          {stripeEnabled() && (!sub?.stripeSubscriptionId || ["canceled", "incomplete_expired", "incomplete"].includes(sub.status)) && (
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
              Witch does not expose a public HTTP API in this release. Keys are not accepted by any
              endpoint yet.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[13px] text-[var(--text-muted)]">
            API access will ship in a later release. Existing keys, if any, cannot call product APIs.
          </div>

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

            <SettingsForm
              action={actionUpdateAccount}
              successTitle="Profile updated"
              successDescription="Your account details have been updated."
              className="space-y-4"
            >
              <div>
                <Label htmlFor="account-name">Your Full Name</Label>
                <Input id="account-name" name="name" defaultValue={ctx.userName} required />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input value={ctx.userEmail} disabled className="opacity-60 cursor-not-allowed" />
              </div>

              <SaveButton label="Update profile" loadingLabel="Updating profile..." variant="secondary" className="w-full sm:w-auto" />
            </SettingsForm>
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

              <Button type="submit" variant="secondary" className="w-full sm:w-auto">
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
                Devices and browser sessions currently authenticated to your account.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
              {userSessions.map((session) => {
                const device = parseUserAgent(session.userAgent);
                const isCurrent = session.id === currentSessionId;
                const ipText =
                  session.ipAddress && session.ipAddress.trim()
                    ? session.ipAddress.trim() === "127.0.0.1"
                      ? "127.0.0.1 (Localhost)"
                      : session.ipAddress.trim()
                    : "Local / Direct";

                return (
                  <div
                    key={session.id}
                    className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-[12px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                        {device.deviceType === "mobile" ? (
                          <Smartphone className="h-4 w-4" />
                        ) : device.deviceType === "tablet" ? (
                          <Tablet className="h-4 w-4" />
                        ) : (
                          <Laptop className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[var(--text)] truncate">
                            {device.label}
                          </span>
                          {isCurrent && (
                            <Badge variant="healthy" size="sm">
                              Current session
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="mono">{ipText}</span>
                          <span>·</span>
                          <span>Signed in {new Date(session.createdAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>Expires {new Date(session.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="self-end sm:self-center shrink-0">
                      {isCurrent ? (
                        <form action={actionSignOut}>
                          <Button variant="ghost" size="sm" className="text-[var(--text-muted)] hover:text-[var(--text)]">
                            Sign out
                          </Button>
                        </form>
                      ) : (
                        <form action={actionRevokeSession.bind(null, session.id)}>
                          <Button variant="ghost" size="sm" className="text-[var(--critical)] hover:text-[var(--critical)]">
                            Revoke
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
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

