import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server } from "../../scripts/fixture-server";
import { runBrowserCheck } from "./browser";
import { compareScreenshots } from "./visual";

const testPort = 3457;
let baseUrl = "";

beforeAll(async () => {
  process.env.FIXTURE_ENABLED = "true";
  process.env.FIXTURE_PORT = String(testPort);
  await new Promise<void>((resolve) => {
    server.listen(testPort, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${testPort}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("Visual Monitoring & Stabilization Pipeline", () => {
  it("captures mature delayed content instead of skeleton loader", async () => {
    // ?state=delayed-content renders skeleton initially, then inserts button.checkout after 800ms
    const result = await runBrowserCheck({
      url: `${baseUrl}/?state=delayed-content`,
      viewport: "desktop",
      selector: "button.checkout",
    });

    expect(result.success).toBe(true);
    expect(result.elementFound).toBe(true);
    expect(result.elementText).toContain("Checkout");
    expect(result.pageStabilized).toBe(true);
    expect(result.stabilization?.layoutStable).toBe(true);
    expect(result.screenshot).toBeTruthy();
  }, 15_000);

  it("handles cookie consent masking and clean capture deterministically", async () => {
    // 1. With ignoreCookieConsent: false -> banner is not masked
    const unmasked = await runBrowserCheck({
      url: `${baseUrl}/?state=cookie-banner`,
      viewport: "desktop",
      visualNoiseSettings: {
        ignoreCookieConsent: false,
        cleanCapture: false,
      },
    });
    const cookieRegionsUnmasked = unmasked.ignoreRegions.filter((r) => r.source === "cookie");
    expect(cookieRegionsUnmasked.length).toBe(0);

    // 2. With ignoreCookieConsent: true -> banner is detected and masked
    const masked = await runBrowserCheck({
      url: `${baseUrl}/?state=cookie-banner`,
      viewport: "desktop",
      visualNoiseSettings: {
        ignoreCookieConsent: true,
        cleanCapture: false,
      },
    });
    const cookieRegionsMasked = masked.ignoreRegions.filter((r) => r.source === "cookie");
    expect(cookieRegionsMasked.length).toBeGreaterThan(0);
    expect(cookieRegionsMasked[0].y).toBeGreaterThan(0);

    // 3. With cleanCapture: true -> banner is hidden in screenshot
    const cleaned = await runBrowserCheck({
      url: `${baseUrl}/?state=cookie-banner`,
      viewport: "desktop",
      visualNoiseSettings: {
        ignoreCookieConsent: true,
        cleanCapture: true,
      },
    });
    expect(cleaned.success).toBe(true);
    expect(cleaned.screenshot).toBeTruthy();
  }, 25_000);

  it("never masks or hides legitimate error / payment failure notices", async () => {
    // Even with all noise filters and clean capture turned on, payment failure modal must be preserved
    const result = await runBrowserCheck({
      url: `${baseUrl}/?state=legitimate-modal`,
      viewport: "desktop",
      visualNoiseSettings: {
        ignoreCookieConsent: true,
        ignoreChatWidgets: true,
        ignoreMarketingPopups: true,
        ignoreAds: true,
        ignoreStickyPromos: true,
        cleanCapture: true,
      },
    });

    expect(result.success).toBe(true);
    // Should NOT have any marketing or cookie ignore regions on the error dialog
    const modalRegions = result.ignoreRegions.filter(
      (r) => r.reason?.includes("error-dialog") || r.source === "marketing" || r.source === "cookie",
    );
    expect(modalRegions.length).toBe(0);
  }, 15_000);

  it("produces near-zero visual difference across repeated stable captures", async () => {
    const run1 = await runBrowserCheck({
      url: `${baseUrl}/?state=healthy`,
      viewport: "desktop",
    });
    const run2 = await runBrowserCheck({
      url: `${baseUrl}/?state=healthy`,
      viewport: "desktop",
    });
    const run3 = await runBrowserCheck({
      url: `${baseUrl}/?state=healthy`,
      viewport: "desktop",
    });

    expect(run1.screenshot).toBeTruthy();
    expect(run2.screenshot).toBeTruthy();
    expect(run3.screenshot).toBeTruthy();

    const diff1v2 = await compareScreenshots(run1.screenshot!, run2.screenshot!, "MEDIUM", run2.ignoreRegions);
    const diff2v3 = await compareScreenshots(run2.screenshot!, run3.screenshot!, "MEDIUM", run3.ignoreRegions);

    expect(diff1v2.filteredDifferenceRatio).toBeLessThan(0.001);
    expect(diff1v2.aboveThreshold).toBe(false);
    expect(diff2v3.filteredDifferenceRatio).toBeLessThan(0.001);
    expect(diff2v3.aboveThreshold).toBe(false);
  }, 30_000);

  it("handles desktop and mobile viewports independently", async () => {
    // mobile-broken-layout has checkout visible on desktop, hidden on mobile
    const desktop = await runBrowserCheck({
      url: `${baseUrl}/?state=mobile-broken-layout`,
      viewport: "desktop",
      selector: "button.checkout",
    });
    const mobile = await runBrowserCheck({
      url: `${baseUrl}/?state=mobile-broken-layout`,
      viewport: "mobile",
      selector: "button.checkout",
    });

    expect(desktop.elementFound).toBe(true);
    expect(mobile.elementFound).toBe(false);
  }, 20_000);
});
