import { NextResponse } from "next/server";
import { getPool } from "@/db";

export async function GET() {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
