import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { hashApiKey } from "@/lib/crypto";
import { writeAudit } from "@/server/audit";
import type { OrgContext } from "@/server/tenancy";

export async function createApiKey(
  ctx: OrgContext,
  name: string,
): Promise<{ id: string; prefix: string; secret: string }> {
  void ctx;
  void name;
  throw new Error("Public API access is not available in this release.");
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
