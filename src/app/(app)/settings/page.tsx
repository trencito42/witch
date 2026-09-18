import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, alertChannels, organizations, sessions, subscriptions } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { Button, Input, Label, Select } from "@/components/ui";
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

export default async function SettingsPage() {
  const ctx = await requireOrgContext();
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

  return (
    <div className="max-w-2xl space-y-12">
      <PageHeader title="Settings" description="Workspace, billing, API keys, and account." />

      <section>
        <h2 className="mb-4 text-[13px] text-[var(--text-muted)]">Workspace</h2>
        <form action={actionRenameWorkspace} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input name="name" defaultValue={org?.name} />
          </div>
          <div>
            <Label>Billing email</Label>
            <Input name="billingEmail" type="email" defaultValue={org?.billingEmail ?? ""} />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input name="timezone" defaultValue={org?.timezone ?? "UTC"} />
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="alertOnIncident" defaultChecked={org?.alertOnIncident} />
            Incident alerts
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="alertOnRecovery" defaultChecked={org?.alertOnRecovery} />
            Recovery alerts
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="monthlyReportsEnabled" defaultChecked={org?.monthlyReportsEnabled} />
            Monthly reports
          </label>
          <div>
            <Label>Minimum severity</Label>
            <Select
              name="minAlertSeverity"
              defaultValue={org?.minAlertSeverity}
            >
              {["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="statusPageEnabled" defaultChecked={org?.statusPageEnabled} />
            Public status page
          </label>
          <div>
            <Label>Status page slug</Label>
            <Input name="statusPageSlug" defaultValue={org?.statusPageSlug ?? ""} />
          </div>
          <Button>Save workspace</Button>
        </form>
      </section>

      <section>
        <h2 className="text-[13px] text-[var(--text-muted)] mb-4">Billing</h2>
        <p className="text-[13px] mb-4">
          Current plan: {ctx.plan.name}. Status: {sub?.status ?? ctx.subscriptionStatus}.
          {sub?.currentPeriodEnd ? ` Period ends ${sub.currentPeriodEnd.toISOString().slice(0, 10)}.` : ""}
        </p>
        {stripeEnabled() ? (
          sub?.stripeSubscriptionId && !["canceled", "incomplete_expired"].includes(sub.status) ? (
            <form action={actionPortal}>
              <Button>Manage plan in Stripe</Button>
            </form>
          ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {(["freelancer", "agency", "agency_pro"] as PlanId[]).map((plan) => (
              <form key={plan} action={actionCheckout.bind(null, plan)}>
                <Button variant="secondary" className="w-full">
                  {PLANS[plan].name} · ${PLANS[plan].monthlyPriceUsd}/mo
                </Button>
              </form>
            ))}
          </div>
          )
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            Stripe credentials are not configured. The Free plan remains active.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[13px] text-[var(--text-muted)]">Discord alerts</h2>
        {canUseEmailAlerts(ctx.plan.id) ? (
          <>
            <form action={actionAddDiscordWebhook} className="flex flex-col gap-2 sm:flex-row">
              <Input name="webhookUrl" placeholder="https://discord.com/api/webhooks/…" className="flex-1" />
              <Button variant="secondary">Add webhook</Button>
            </form>
            <ul className="mt-4 text-[13px]">
              {channels
                .filter((channel) => channel.type === "DISCORD_WEBHOOK")
                .map((channel) => (
                  <li key={channel.id} className="flex items-center justify-between border-b border-[var(--border)] py-2">
                    <span>{maskDiscordWebhookUrl(channel.destination)}</span>
                    <form action={actionDeleteAlertChannel.bind(null, channel.id)}>
                      <Button variant="ghost">Remove</Button>
                    </form>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            Discord webhooks are available on Freelancer and above.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[13px] text-[var(--text-muted)]">Email alerts</h2>
        {canUseEmailAlerts(ctx.plan.id) ? (
          <>
            <form action={actionAddEmailChannel} className="flex flex-col gap-2 sm:flex-row">
              <Input name="email" type="email" placeholder="alerts@example.com" className="flex-1" />
              <Button variant="secondary">Add email</Button>
            </form>
            <ul className="mt-4 text-[13px]">
              {channels
                .filter((channel) => channel.type === "EMAIL")
                .map((channel) => (
                  <li key={channel.id} className="flex items-center justify-between border-b border-[var(--border)] py-2">
                    <span>{channel.destination}</span>
                    <form action={actionDeleteAlertChannel.bind(null, channel.id)}>
                      <Button variant="ghost">Remove</Button>
                    </form>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            Email alerts are available on Freelancer and above.
          </p>
        )}
      </section>

      <section>
        <CreateKeyForm />
        <ul className="mt-4 text-[13px]">
          {keys.map((key) => (
            <li key={key.id} className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>
                {key.name} · {key.prefix}… {key.revokedAt ? "(revoked)" : ""}
              </span>
              {!key.revokedAt && (
                <form action={actionRevokeKey.bind(null, key.id)}>
                  <Button variant="ghost">Revoke</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[13px] text-[var(--text-muted)] mb-4">Account</h2>
        <form action={actionUpdateAccount} className="space-y-3 mb-6">
          <div>
            <Label>Name</Label>
            <Input name="name" defaultValue={ctx.userName} />
          </div>
          <p className="text-[12px] text-[var(--text-muted)]">{ctx.userEmail}</p>
          <Button variant="secondary">Save account</Button>
        </form>
        <form action={actionChangePassword} className="space-y-3">
          <div>
            <Label>Current password</Label>
            <Input name="currentPassword" type="password" required />
          </div>
          <div>
            <Label>New password</Label>
            <Input name="newPassword" type="password" required minLength={10} />
          </div>
          <Button variant="secondary">Change password</Button>
        </form>
        <div className="mt-6 text-[12px] text-[var(--text-muted)] space-y-2">
          {userSessions.map((session) => (
            <form key={session.id} action={actionRevokeSession.bind(null, session.id)} className="flex justify-between gap-2">
              <span>
                {session.ipAddress ?? "session"} · expires {session.expiresAt.toISOString().slice(0, 10)}
              </span>
              <Button variant="ghost">Revoke</Button>
            </form>
          ))}
        </div>
        <form action={actionDeleteAccount} className="mt-8">
          <Button variant="danger">Delete account</Button>
        </form>
      </section>

      <section>
        <h2 className="text-[13px] text-[var(--text-muted)] mb-4">New workspace</h2>
        <form action={actionCreateWorkspace} className="flex gap-2">
          <Input name="name" placeholder="Agency workspace" required />
          <Button variant="secondary">Create</Button>
        </form>
      </section>
    </div>
  );
}
