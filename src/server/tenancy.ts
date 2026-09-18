import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { ADMIN_ROLES, ORG_COOKIE, WRITE_ROLES, type OrgRole } from "@/lib/constants";
import { getPlanLimits, entitledPlanId, type PlanLimits } from "@/lib/plans";
import { requireSession } from "./session";
import { findMembership, findOrganizationsForUser } from "./organizations";

export class AuthorizationError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type OrgContext = {
  userId: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
  plan: PlanLimits;
  subscriptionStatus: string;
};

export async function requireOrgContext(
  organizationId?: string,
): Promise<OrgContext> {
  const session = await requireSession();
  const memberships = await findOrganizationsForUser(session.user.id);
  if (!memberships.length) redirect("/onboarding");

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ORG_COOKIE)?.value;
  const selectedId = organizationId ?? cookieOrg ?? memberships[0]!.id;
  const membership =
    memberships.find((item) => item.id === selectedId) ??
    (organizationId ? undefined : memberships[0]);
  if (!membership) throw new AuthorizationError();
  const memberRow = await findMembership(session.user.id, membership.id);
  if (!memberRow) throw new AuthorizationError();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, membership.id))
    .limit(1);
  if (!org) throw new AuthorizationError();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, org.id))
    .limit(1);

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    isAdmin: Boolean(
      (session.user as { isAdmin?: boolean }).isAdmin,
    ),
    organizationId: org.id,
    organizationName: org.name,
    role: memberRow.role as OrgRole,
    plan: getPlanLimits(entitledPlanId(sub?.planId, sub?.status)),
    subscriptionStatus: sub?.status ?? "active",
  };
}

export function assertWritable(ctx: OrgContext) {
  if (!WRITE_ROLES.includes(ctx.role)) {
    throw new AuthorizationError("Your role cannot make this change.");
  }
}

export function assertAdmin(ctx: OrgContext) {
  if (!ADMIN_ROLES.includes(ctx.role)) {
    throw new AuthorizationError("Admin access is required.");
  }
}

export function assertOwner(ctx: OrgContext) {
  if (ctx.role !== "OWNER") {
    throw new AuthorizationError("Only the owner can do this.");
  }
}

export async function setActiveOrganization(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function persistDefaultOrganization(userId: string) {
  const orgs = await findOrganizationsForUser(userId);
  if (orgs[0]) await setActiveOrganization(orgs[0].id);
}
