import { describe, expect, it } from "vitest";
import {
  canCreateSite,
  canUseBrowserMonitoring,
  getPlanLimits,
  minIntervalForMonitor,
} from "./plans";

describe("plan limits", () => {
  it("blocks a second free site", () => {
    expect(canCreateSite("free", 1)).toBe(false);
    expect(canCreateSite("freelancer", 1)).toBe(true);
  });

  it("disables browser monitoring on free", () => {
    expect(canUseBrowserMonitoring("free")).toBe(false);
    expect(canUseBrowserMonitoring("agency")).toBe(true);
  });

  it("enforces minimum intervals", () => {
    expect(minIntervalForMonitor("free", "HTTP")).toBe(1800);
    expect(minIntervalForMonitor("freelancer", "HTTP")).toBe(300);
    expect(getPlanLimits("nope").id).toBe("free");
  });
});
