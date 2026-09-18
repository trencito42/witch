import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { hashApiKey, randomToken } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { writeAudit } from "@/server/audit";
import type { OrgContext } from "@/server/tenancy";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getPlanLimits } from "@/lib/plans";

export async function createApiKey(ctx: OrgContext, name: string) {
  await enforceRateLimit({
    key: `api-key:${ctx.organizationId}:${ctx.userId}`,
    limit: 8,
    windowSeconds: 3600,
  });
  const existing = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.organizationId, ctx.organizationId), isNull(apiKeys.revokedAt)));
  if (existing.length >= getPlanLimits(ctx.plan.id).maxApiKeys) {
    throw new Error("API key limit reached for this plan.");
  }
  const secret = `wch_${randomToken(24)}`;
  const prefix = secret.slice(0, 10);
  const id = newId();
  await db.insert(apiKeys).values({
    id,
    organizationId: ctx.organizationId,
    name,
    prefix,
    secretHash: hashApiKey(secret),
    createdByUserId: ctx.userId,
    createdAt: new Date(),
  });
  await writeAudit({
    action: "api_key.created",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetId: id,
  });
  return { id, prefix, secret };
}

export async function revokeApiKey(ctx: OrgContext, id: string) {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, ctx.organizationId)));
  await writeAudit({
    action: "api_key.revoked",
    actorUserId: ctx.userId,
    organizationId: ctx.organizationId,
    targetId: id,
  });
}

export async function verifyApiKey(secret: string) {
  const secretHash = hashApiKey(secret);
  const [key] = await db.select().from(apiKeys).where(eq(apiKeys.secretHash, secretHash)).limit(1);
  if (!key || key.revokedAt) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));
  return key;
}
