import { describe, expect, it } from "vitest";
import {
  canCreateSite,
  canCreateWorkspace,
  canUseBrowserMonitoring,
  canUseAiAnalysis,
  entitledPlanId,
  getEffectivePlan,
  getPlanLimits,
  highestPlan,
  minIntervalForMonitor,
  subscriptionGrantsEntitlements,
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

  it("caps free workspaces", () => {
    expect(canCreateWorkspace("free", 1)).toBe(false);
    expect(canCreateWorkspace("agency", 1)).toBe(true);
    expect(highestPlan(["free", "freelancer"])).toBe("freelancer");
  });

  it("drops paid entitlements when Stripe is unpaid or incomplete", () => {
    expect(subscriptionGrantsEntitlements("active")).toBe(true);
    expect(subscriptionGrantsEntitlements("past_due")).toBe(true);
    expect(subscriptionGrantsEntitlements("unpaid")).toBe(false);
    expect(subscriptionGrantsEntitlements("incomplete")).toBe(false);
    expect(subscriptionGrantsEntitlements("incomplete_expired")).toBe(false);
    expect(subscriptionGrantsEntitlements("canceled")).toBe(false);
    expect(entitledPlanId("agency", "unpaid")).toBe("free");
    expect(entitledPlanId("agency", "past_due")).toBe("agency");
    expect(getEffectivePlan({ planId: "agency", status: "unpaid" }).id).toBe("free");
    expect(getEffectivePlan({ planId: "agency", status: "past_due" }).browserMonitoring).toBe(true);
    expect(canUseAiAnalysis("free")).toBe(false);
    expect(canUseAiAnalysis("freelancer")).toBe(true);
  });
});
