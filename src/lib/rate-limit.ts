import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { logger } from "./logger";
import { sha256Hex } from "./crypto";

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super("Too many attempts. Wait and try again.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}) {
  const keyHash = sha256Hex(input.key);
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (input.windowSeconds * 1000)) * input.windowSeconds * 1000,
  );

  try {
    await db.execute(sql`
      INSERT INTO \`rate_limit\` (\`key_hash\`, \`window_start\`, \`count\`, \`updated_at\`)
      VALUES (${keyHash}, ${windowStart}, 1, ${now})
      ON DUPLICATE KEY UPDATE
        \`count\` = IF(\`window_start\` = VALUES(\`window_start\`), \`count\` + 1, 1),
        \`window_start\` = VALUES(\`window_start\`),
        \`updated_at\` = VALUES(\`updated_at\`)
    `);

    const [row] = await db
      .select({ count: rateLimits.count })
      .from(rateLimits)
      .where(eq(rateLimits.keyHash, keyHash))
      .limit(1);

    if ((row?.count ?? 0) > input.limit) {
      throw new RateLimitError(input.windowSeconds);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    logger.warn({ err: error }, "rate limit store unavailable");
  }
}
