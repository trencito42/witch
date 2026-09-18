import { describe, expect, it } from "vitest";
import { canUseBrowserMonitoring, canUseEmailAlerts } from "./plans";

describe("plan-aware onboarding", () => {
  it("does not promise visual monitoring on free", () => {
    expect(canUseBrowserMonitoring("free")).toBe(false);
    expect(canUseEmailAlerts("free")).toBe(false);
    expect(canUseBrowserMonitoring("freelancer")).toBe(true);
    expect(canUseEmailAlerts("freelancer")).toBe(true);
  });
});
