import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationInvitations } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { listMembers } from "@/features/team/service";
import { Button, Input, Select } from "@/components/ui";
import {
  actionChangeRole,
  actionInvite,
  actionLeave,
  actionRemoveMember,
  actionRevokeInvite,
  actionTransfer,
} from "@/app/actions";

export default async function TeamPage() {
  const ctx = await requireOrgContext();
  const members = await listMembers(ctx.organizationId);
  const invites = await db
    .select()
    .from(organizationInvitations)
    .where(eq(organizationInvitations.organizationId, ctx.organizationId));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Team" description="People who can see and manage this workspace." />
      <ul className="text-[13px] mb-8">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between border-b border-[var(--border)] py-3 gap-3">
            <div>
              <div>{member.name}</div>
              <div className="text-[var(--text-muted)]">{member.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <span>{member.role}</span>
              {ctx.role === "OWNER" && member.role !== "OWNER" && (
                <>
                  <form action={actionChangeRole.bind(null, member.id, "ADMIN")}>
                    <Button variant="ghost">Admin</Button>
                  </form>
                  <form action={actionRemoveMember.bind(null, member.id)}>
                    <Button variant="ghost">Remove</Button>
                  </form>
                  <form action={actionTransfer.bind(null, member.id)}>
                    <Button variant="ghost">Make owner</Button>
                  </form>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {["OWNER", "ADMIN"].includes(ctx.role) && (
        <form action={actionInvite} className="flex gap-2 mb-8">
          <Input name="email" type="email" placeholder="email@agency.com" required />
          <Select name="role">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
            <option value="VIEWER">Viewer</option>
          </Select>
          <Button>Invite</Button>
        </form>
      )}
      <h2 className="text-[13px] text-[var(--text-muted)] mb-2">Invitations</h2>
      <ul className="text-[13px] mb-8">
        {invites.filter((invite) => !invite.revokedAt && !invite.acceptedAt).map((invite) => (
          <li key={invite.id} className="flex justify-between py-2">
            <span>
              {invite.email} · {invite.role}
            </span>
            <form action={actionRevokeInvite.bind(null, invite.id)}>
              <Button variant="ghost">Revoke</Button>
            </form>
          </li>
        ))}
      </ul>
      {ctx.role !== "OWNER" && (
        <form action={actionLeave}>
          <Button variant="danger">Leave organization</Button>
        </form>
      )}
    </div>
  );
}
