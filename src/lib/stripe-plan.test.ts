import { describe, expect, it } from "vitest";
import { planFromPriceId, resolveStripePlan } from "./stripe-plan";

const catalog = {
  freelancer: "price_freelancer",
  agency: "price_agency",
  agencyPro: "price_agency_pro",
};

describe("planFromPriceId", () => {
  it("returns null when Stripe omits the price id", () => {
    expect(planFromPriceId(null, catalog)).toBeNull();
    expect(planFromPriceId(undefined, catalog)).toBeNull();
  });
});

describe("resolveStripePlan", () => {
  it("uses checkout metadata when priceId is still null", () => {
    expect(
      resolveStripePlan({
        priceId: null,
        metadataPlan: "agency",
        catalog,
      }),
    ).toBe("agency");
  });

  it("prefers a matched price over metadata", () => {
    expect(
      resolveStripePlan({
        priceId: "price_freelancer",
        metadataPlan: "agency",
        catalog,
      }),
    ).toBe("freelancer");
  });

  it("falls back to free only when neither price nor paid metadata is present", () => {
    expect(resolveStripePlan({ priceId: null, metadataPlan: null, catalog })).toBe("free");
  });
});
