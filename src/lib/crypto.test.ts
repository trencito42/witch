import { describe, expect, it } from "vitest";
import { statusSubscriptionToken } from "./crypto";

describe("statusSubscriptionToken", () => {
  const base = {
    subscriberId: "sub_123",
    organizationId: "org_123",
    email: "User@Example.com",
    secret: "test-secret-that-is-long-enough",
  };

  it("is deterministic and normalizes email casing", () => {
    const a = statusSubscriptionToken({ ...base, purpose: "confirm" });
    const b = statusSubscriptionToken({ ...base, email: "user@example.com", purpose: "confirm" });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("separates confirmation and unsubscribe tokens", () => {
    const confirm = statusSubscriptionToken({ ...base, purpose: "confirm" });
    const unsubscribe = statusSubscriptionToken({ ...base, purpose: "unsubscribe" });
    expect(confirm).not.toBe(unsubscribe);
  });

  it("binds the token to subscriber and organization", () => {
    const token = statusSubscriptionToken({ ...base, purpose: "confirm" });
    expect(
      statusSubscriptionToken({ ...base, subscriberId: "sub_other", purpose: "confirm" }),
    ).not.toBe(token);
    expect(
      statusSubscriptionToken({ ...base, organizationId: "org_other", purpose: "confirm" }),
    ).not.toBe(token);
  });
});
