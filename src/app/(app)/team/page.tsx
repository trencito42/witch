import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationInvitations } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { PageHeader } from "@/components/page-header";
import { listMembers } from "@/features/team/service";
import { Button, Badge } from "@/components/ui";
import {
  actionLeave,
  actionRevokeInvite,
} from "@/app/actions";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { MemberActionMenu } from "@/components/member-action-menu";
import { Users, Mail, Clock, LogOut } from "lucide-react";

export default async function TeamPage() {
  const ctx = await requireOrgContext();
  const members = await listMembers(ctx.organizationId);
  const invites = await db
    .select()
    .from(organizationInvitations)
    .where(eq(organizationInvitations.organizationId, ctx.organizationId));

  const pendingInvites = invites.filter((invite) => !invite.revokedAt && !invite.acceptedAt);
  const canInvite = ["OWNER", "ADMIN"].includes(ctx.role);

  return (
    <div className="space-y-8 max-w-3xl animate-spectral-fade">
      <PageHeader
        title="Team"
        description="Collaborate on synthetic monitoring, incident notifications, and visual baseline audits."
        actions={canInvite ? <InviteMemberDialog /> : null}
      />

      {/* ACTIVE MEMBERS SECTION */}
      <section className="space-y-4">
        <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          Active Members ({members.length})
        </h2>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
          {members.map((member) => {
            const initials = (member.name || member.email || "M")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[12px] font-semibold text-[var(--accent)] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[var(--text)] truncate">
                        {member.name}
                      </span>
                      {member.id === ctx.userId && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-xs bg-[var(--accent-dim)] text-[var(--accent)]">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] truncate">
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={
                      member.role === "OWNER"
                        ? "accent"
                        : member.role === "ADMIN"
                          ? "warning"
                          : "default"
                    }
                    className="uppercase tracking-wider font-semibold text-[10px]"
                  >
                    {member.role}
                  </Badge>

                  <MemberActionMenu
                    memberId={member.id}
                    currentRole={member.role}
                    isOwner={ctx.role === "OWNER"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PENDING INVITATIONS */}
      {pendingInvites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[15px] font-medium text-[var(--text)] flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--warning)]" />
            Pending Invitations ({pendingInvites.length})
          </h2>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="p-3.5 px-4 flex items-center justify-between gap-4 text-[13px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-3.5 w-3.5 text-[var(--text-faint)] shrink-0" />
                  <span className="font-medium text-[var(--text)] truncate">{invite.email}</span>
                  <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                    {invite.role}
                  </Badge>
                </div>

                <form action={actionRevokeInvite.bind(null, invite.id)}>
                  <Button variant="ghost" size="sm">
                    Revoke
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LEAVE WORKSPACE (Non-owners only) */}
      {ctx.role !== "OWNER" && (
        <div className="pt-6 border-t border-[var(--border)]">
          <form action={actionLeave}>
            <Button variant="danger" leadingIcon={<LogOut className="h-3.5 w-3.5" />}>
              Leave workspace
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

