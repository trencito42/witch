import { describe, expect, it } from "vitest";
import { classifyFailedResource, meaningfulFailedResources } from "./assets";

describe("failed asset classification", () => {
  it("treats a visible first-party script as impactful", () => {
    const item = classifyFailedResource(
      { url: "https://shop.example/app.js", status: 500, resourceType: "script" },
      "shop.example",
    );
    expect(item.visibleImpact).toBe(true);
    expect(item.kind).toBe("script");
  });

  it("ignores analytics and favicons", () => {
    const items = meaningfulFailedResources(
      [
        { url: "https://www.google-analytics.com/g/collect", status: 404, resourceType: "xhr" },
        { url: "https://shop.example/favicon.ico", status: 404, resourceType: "image" },
      ],
      "shop.example",
    );
    expect(items).toHaveLength(0);
  });
});
