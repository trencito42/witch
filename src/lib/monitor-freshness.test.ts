import { describe, expect, it } from "vitest";
import { isMonitoringStale } from "./monitor-freshness";

describe("isMonitoringStale", () => {
  const now = new Date("2026-09-18T12:00:00Z");

  it("is not stale when a check is recent", () => {
    expect(
      isMonitoringStale({
        lastCheckedAt: new Date("2026-09-18T11:50:00Z"),
        intervalSeconds: 300,
        now,
      }),
    ).toBe(false);
  });

  it("is stale when the last check is older than 3 intervals", () => {
    expect(
      isMonitoringStale({
        lastCheckedAt: new Date("2026-09-18T11:00:00Z"),
        intervalSeconds: 300,
        now,
      }),
    ).toBe(true);
  });

  it("does not mark paused sites stale", () => {
    expect(
      isMonitoringStale({
        lastCheckedAt: new Date("2026-09-18T10:00:00Z"),
        pausedAt: new Date("2026-09-18T10:01:00Z"),
        now,
      }),
    ).toBe(false);
  });
});
