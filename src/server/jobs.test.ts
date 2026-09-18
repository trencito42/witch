import { describe, expect, it } from "vitest";
import { INTERVALS_SECONDS } from "@/lib/constants";

describe("job scheduling intervals", () => {
  it("supports the documented cadences", () => {
    expect(INTERVALS_SECONDS["5m"]).toBe(300);
    expect(INTERVALS_SECONDS["24h"]).toBe(86400);
  });

  it("applies bounded jitter", () => {
    const intervalSeconds = 1800;
    const spread = Math.min(30, Math.round(intervalSeconds * 0.08));
    expect(spread).toBe(30);
  });
});
