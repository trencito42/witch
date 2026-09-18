import { requireOrgContext } from "@/server/tenancy";
import { findOrganizationsForUser } from "@/server/organizations";
import { actionSignOut, actionSwitchOrg } from "@/app/actions";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const orgs = await findOrganizationsForUser(ctx.userId);

  return (
    <AppShell
      user={{
        id: ctx.userId,
        name: ctx.userName,
        email: ctx.userEmail,
      }}
      organization={{
        id: ctx.organizationId,
        name: ctx.organizationName,
      }}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
      onSignOut={actionSignOut}
      onSwitchOrg={actionSwitchOrg}
    >
      {children}
    </AppShell>
  );
}

