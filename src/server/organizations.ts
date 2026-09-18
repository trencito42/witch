import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  alertChannels,
  organizationMembers,
  organizations,
  subscriptions,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { writeAudit } from "./audit";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workspace";
}

async function uniqueSlug(base: string) {
  let slug = base;
  let i = 0;
  while (true) {
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!existing[0]) return slug;
    i += 1;
    slug = `${base.slice(0, 50)}-${i}`;
  }
}

export async function createPersonalOrganization(input: {
  userId: string;
  name: string;
  email: string;
}) {
  const now = new Date();
  const orgId = newId();
  const workspaceName = `${input.name.split(" ")[0] || "Personal"} workspace`;
  const slug = await uniqueSlug(slugify(`${input.name}-workspace`));

  await db.insert(organizations).values({
    id: orgId,
    name: workspaceName,
    slug,
    billingEmail: input.email,
    timezone: "UTC",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(organizationMembers).values({
    id: newId(),
    organizationId: orgId,
    userId: input.userId,
    role: "OWNER",
    createdAt: now,
  });

  await db.insert(subscriptions).values({
    id: newId(),
    organizationId: orgId,
    planId: "free",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(alertChannels).values({
    id: newId(),
    organizationId: orgId,
    type: "EMAIL",
    name: "Account email",
    destination: input.email,
    enabled: true,
    createdAt: now,
  });

  await writeAudit({
    action: "organization.created",
    actorUserId: input.userId,
    organizationId: orgId,
    targetType: "organization",
    targetId: orgId,
  });

  return { id: orgId, slug, name: workspaceName };
}

export async function createOrganizationForUser(input: {
  userId: string;
  name: string;
  email?: string;
}) {
  const now = new Date();
  const orgId = newId();
  const slug = await uniqueSlug(slugify(input.name));
  await db.insert(organizations).values({
    id: orgId,
    name: input.name,
    slug,
    billingEmail: input.email ?? null,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(organizationMembers).values({
    id: newId(),
    organizationId: orgId,
    userId: input.userId,
    role: "OWNER",
    createdAt: now,
  });
  await db.insert(subscriptions).values({
    id: newId(),
    organizationId: orgId,
    planId: "free",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  if (input.email) {
    await db.insert(alertChannels).values({
      id: newId(),
      organizationId: orgId,
      type: "EMAIL",
      name: "Account email",
      destination: input.email,
      enabled: true,
      createdAt: now,
    });
  }
  return { id: orgId, slug, name: input.name };
}

export async function findOrganizationsForUser(userId: string) {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));
}

export async function findMembership(userId: string, organizationId: string) {
  const rows = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
