import "server-only";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  organizationInvitations,
  organizationMembers,
  organizations,
  subscriptions,
  users,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashApiKey, randomToken } from "@/lib/crypto";
import { canInviteMember, getPlanLimits } from "@/lib/plans";
import { sendInvitationEmail } from "@/emails/send";
import { appUrl } from "@/lib/env";
import { writeAudit } from "@/server/audit";
import { findMembership } from "@/server/organizations";
import type { OrgContext } from "@/server/tenancy";
import { emailSchema } from "@/validation";
import type { OrgRole } from "@/lib/constants";

export async function listMembers(organizationId: string) {
  return db
    .select({
      id: organizationMembers.id,
      role: organizationMembers.role,
      createdAt: organizationMembers.createdAt,
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, organizationId));
}

export async function pendingInviteCount(organizationId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(organizationInvitations)
    .where(
      and(
        eq(organizationInvitations.organizationId, organizationId),
        isNull(organizationInvitations.acceptedAt),
        isNull(organizationInvitations.revokedAt),
        gt(organizationInvitations.expiresAt, new Date()),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function inviteMember(ctx: OrgContext, emailRaw: string, role: OrgRole) {
  const email = emailSchema.parse(emailRaw).toLowerCase();
  if (role === "OWNER") throw new Error("Cannot invite another owner.");
  const members = await listMembers(ctx.organizationId);
  const pending = await pendingInviteCount(ctx.organizationId);
  if (!canInviteMember(ctx.plan.id, members.length + pending)) {
    throw new Error(`The ${ctx.plan.name} plan allows ${ctx.plan.maxMembers} member(s).`);
  }
  if (members.some((member) => member.email.toLowerCase() === email)) {
    throw new Error("That person is already a member.");
  }
  const [existingInvite] = await db
    .select({ id: organizationInvitations.id })
    .from(organizationInvitations)
    .where(
      and(
        eq(organizationInvitations.organizationId, ctx.organizationId),
        eq(organizationInvitations.email, email),
        isNull(organizationInvitations.acceptedAt),
        isNull(organizationInvitations.revokedAt),
        gt(organizationInvitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (existingInvite) throw new Error("An invitation is already pending for that email.");
  const token = randomToken(24);
  const id = newId();
  await db.insert(organizationInvitations).values({
    id,
    organizationId: ctx.organizationId,
    email,
    role,
    tokenHash: hashApiKey(token),
    invitedByUserId: ctx.userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
  await sendInvitationEmail({
    to: email,
    organizationName: ctx.organizationName,
    role,
    url: `${appUrl()}/invite/${token}`,
  });
  await writeAudit({
    action: "member.invited",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    metadata: { email, role },
  });
  return { id };
}

export async function revokeInvitation(ctx: OrgContext, invitationId: string) {
  await db
    .update(organizationInvitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, ctx.organizationId),
      ),
    );
}

export async function removeMember(ctx: OrgContext, memberId: string) {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  if (!member) throw new Error("Member not found.");
  if (member.role === "OWNER") throw new Error("Transfer ownership before removing the owner.");
  await db.delete(organizationMembers).where(eq(organizationMembers.id, member.id));
  await writeAudit({
    action: "member.removed",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetId: member.userId,
  });
}

export async function changeRole(ctx: OrgContext, memberId: string, role: OrgRole) {
  if (role === "OWNER") throw new Error("Use transfer ownership instead.");
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  if (!member) throw new Error("Member not found.");
  if (member.role === "OWNER") throw new Error("Use transfer ownership instead.");
  await db
    .update(organizationMembers)
    .set({ role })
    .where(
      and(
        eq(organizationMembers.id, member.id),
        eq(organizationMembers.organizationId, ctx.organizationId),
      ),
    );
  await writeAudit({
    action: "member.role_changed",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetId: memberId,
    metadata: { role },
  });
}

export async function leaveOrganization(ctx: OrgContext) {
  if (ctx.role === "OWNER") throw new Error("Transfer ownership before leaving.");
  await db
    .delete(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, ctx.organizationId),
        eq(organizationMembers.userId, ctx.userId),
      ),
    );
}

export async function transferOwnership(ctx: OrgContext, memberId: string) {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  if (!member) throw new Error("Member not found.");
  await db.transaction(async (tx) => {
    await tx
      .update(organizationMembers)
      .set({ role: "ADMIN" })
      .where(
        and(
          eq(organizationMembers.organizationId, ctx.organizationId),
          eq(organizationMembers.userId, ctx.userId),
        ),
      );
    await tx.update(organizationMembers).set({ role: "OWNER" }).where(eq(organizationMembers.id, member.id));
  });
}

export async function acceptInvitation(userId: string, email: string, token: string) {
  const tokenHash = hashApiKey(token);
  const [invite] = await db
    .select()
    .from(organizationInvitations)
    .where(eq(organizationInvitations.tokenHash, tokenHash))
    .limit(1);
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error("Invitation is invalid or expired.");
  }
  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address.");
  }
  const members = await memberCount(invite.organizationId);
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, invite.organizationId))
    .limit(1);
  const plan = getPlanLimits(sub?.planId ?? "free");
  if (!canInviteMember(plan.id, members)) {
    throw new Error(`The ${plan.name} plan allows ${plan.maxMembers} member(s).`);
  }
  const existing = await findMembership(userId, invite.organizationId);
  if (!existing) {
    await db.insert(organizationMembers).values({
      id: newId(),
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
      createdAt: new Date(),
    });
  }
  await db
    .update(organizationInvitations)
    .set({ acceptedAt: new Date() })
    .where(eq(organizationInvitations.id, invite.id));
  return invite.organizationId;
}

export async function renameOrganization(ctx: OrgContext, name: string) {
  await db
    .update(organizations)
    .set({ name, updatedAt: new Date() })
    .where(eq(organizations.id, ctx.organizationId));
}

export async function memberCount(organizationId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, organizationId));
  return Number(row?.value ?? 0);
}
