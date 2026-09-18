import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { visualDiffs, visualSnapshots } from "@/db/schema";
import { getSession } from "@/server/session";
import { findMembership } from "@/server/organizations";
import { getStorage } from "@/storage";

async function authorizeOrg(organizationId: string) {
  const session = await getSession();
  if (!session?.user) return false;
  const membership = await findMembership(session.user.id, organizationId);
  return Boolean(membership);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if (kind === "diff") {
    const [diff] = await db.select().from(visualDiffs).where(eq(visualDiffs.id, id)).limit(1);
    if (!diff?.diffStorageKey) return new NextResponse("Not found", { status: 404 });
    if (!(await authorizeOrg(diff.organizationId))) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const bytes = await getStorage().get(diff.diffStorageKey);
    if (!bytes) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=3600" },
    });
  }

  const [snapshot] = await db.select().from(visualSnapshots).where(eq(visualSnapshots.id, id)).limit(1);
  if (!snapshot) return new NextResponse("Not found", { status: 404 });
  if (!(await authorizeOrg(snapshot.organizationId))) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const bytes = await getStorage().get(snapshot.storageKey);
  if (!bytes) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": snapshot.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

void and;
