import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { db } from "@/db";
import { jobs, systemHeartbeats } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const heartbeats = await db.select().from(systemHeartbeats);
  const queue = await db
    .select({ status: jobs.status, count: sql<number>`count(*)` })
    .from(jobs)
    .groupBy(jobs.status);
  return NextResponse.json({ heartbeats, queue });
}
