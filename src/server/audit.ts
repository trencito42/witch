import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { newId } from "@/lib/ids";

export async function writeAudit(input: {
  action: string;
  actorUserId?: string | null;
  organizationId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  await db.insert(auditLogs).values({
    id: newId(),
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    organizationId: input.organizationId ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress ?? null,
    createdAt: new Date(),
  });
}

export async function listAuditLogs(organizationId: string, limit = 50) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}

export { and };
