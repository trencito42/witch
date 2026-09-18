import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "./client-ip";

describe("clientIpFromHeaders", () => {
  it("prefers X-Real-IP set by the reverse proxy", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1, 10.0.0.8",
      "x-real-ip": "203.0.113.9",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.9");
  });

  it("uses the last X-Forwarded-For hop when X-Real-IP is missing", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1, 203.0.113.9",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.9");
  });
});
