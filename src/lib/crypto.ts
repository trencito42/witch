import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashApiKey(secret: string): string {
  return sha256Hex(secret);
}

export function hmacSha256Hex(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function statusSubscriptionToken(input: {
  subscriberId: string;
  organizationId: string;
  email: string;
  purpose: "confirm" | "unsubscribe";
  secret: string;
}): string {
  return hmacSha256Hex(
    [input.purpose, input.subscriberId, input.organizationId, input.email.toLowerCase()].join(":"),
    input.secret,
  );
}
