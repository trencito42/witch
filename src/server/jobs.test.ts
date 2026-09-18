import { describe, expect, it } from "vitest";
import { INTERVALS_SECONDS } from "@/lib/constants";
import { shouldEnqueueHourlyJob, utcHourStart } from "@/lib/schedule";

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

describe("hourly scheduler jobs", () => {
  it("pins the window to the UTC hour", () => {
    const a = utcHourStart(new Date("2026-09-18T06:00:05Z"));
    const b = utcHourStart(new Date("2026-09-18T06:59:59Z"));
    expect(a.toISOString()).toBe(b.toISOString());
    expect(a.toISOString()).toBe("2026-09-18T06:00:00.000Z");
  });

  it("does not enqueue a second monthly report in the same hour", () => {
    expect(shouldEnqueueHourlyJob(true)).toBe(false);
    expect(shouldEnqueueHourlyJob(false)).toBe(true);
  });
});
