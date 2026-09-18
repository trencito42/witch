/**
 * Opt-in development seed. Never run in production.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logger } from "@/lib/logger";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed production.");
}

async function main() {
  const email = process.env.SEED_EMAIL ?? "dev@witch.pw";
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    logger.info("seed user already exists");
    return;
  }
  logger.info(
    "Create an account through /signup instead. This seed only documents the opt-in path.",
  );
}

main();
