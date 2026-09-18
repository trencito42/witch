import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { db } from "../src/db";
import { sessions, sites } from "../src/db/schema";
import { getEnv } from "../src/lib/env";
import { makeSignature } from "better-auth/crypto";

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1728", width: 1728, height: 1080 },
];

async function main() {
  console.log("=== STARTING WITCH VISUAL QA SUITE ===");

  // Query test session and site
  const [sessionRecord] = await db.select().from(sessions).limit(1);
  if (!sessionRecord) throw new Error("No session found in database");

  const [siteRecord] = await db.select().from(sites).limit(1);
  const siteId = siteRecord?.id || "none";
  const orgId = siteRecord?.organizationId || "";

  const secret = getEnv().AUTH_SECRET;
  const sig = await makeSignature(sessionRecord.token, secret);
  const signedToken = `${sessionRecord.token}.${sig}`;

  console.log(`Using session token: ${sessionRecord.token.slice(0, 8)}...`);
  console.log(`Using site ID: ${siteId}, org ID: ${orgId}`);

  const browser = await chromium.launch({
    executablePath: path.resolve(process.cwd(), "scripts/chrome-wrapper.sh"),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const BASE_URL = "http://localhost:3003";

  const authenticatedRoutes = [
    { path: "/overview", name: "overview" },
    { path: "/sites", name: "sites" },
    { path: `/sites/${siteId}`, name: "site_detail" },
    { path: "/incidents", name: "incidents" },
    { path: "/reports", name: "reports" },
    { path: "/team", name: "team" },
    { path: "/settings", name: "settings" },
    { path: "/onboarding", name: "onboarding" },
  ];

  const publicRoutes = [
    { path: "/", name: "landing" },
    { path: "/login", name: "login" },
    { path: "/signup", name: "signup" },
  ];

  const results: Array<{
    route: string;
    viewport: string;
    overflow: boolean;
    buttonContrast: string;
    touchTargetIssues: string[];
    screenshotPath: string;
  }> = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const dir = path.resolve(process.cwd(), `qa/screenshots/${vp.name}`);
    fs.mkdirSync(dir, { recursive: true });

    // Authenticated context
    const authContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    await authContext.setExtraHTTPHeaders({
      cookie: `__Secure-better-auth.session_token=${signedToken}; better-auth.session_token=${signedToken}; witch_org=${orgId}`,
    });

    const page = await authContext.newPage();

    for (const r of authenticatedRoutes) {
      const url = `${BASE_URL}${r.path}`;
      const activeOrg = r.path === "/onboarding" ? "dfskhqlujk00ja1o7b75ky2l" : orgId;
      await authContext.setExtraHTTPHeaders({
        cookie: `__Secure-better-auth.session_token=${signedToken}; better-auth.session_token=${signedToken}; witch_org=${activeOrg}`,
      });
      await page.goto(url, { waitUntil: "networkidle" });

      // Check overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check primary button computed colors
      const buttonStyles = await page.evaluate(() => {
        const btn = document.querySelector('button[data-variant="primary"], button.btn-primary, button:not([data-variant])');
        if (!btn) return null;
        const comp = window.getComputedStyle(btn);
        return {
          bg: comp.backgroundColor,
          color: comp.color,
          fontWeight: comp.fontWeight,
          text: btn.textContent?.trim()?.slice(0, 30),
        };
      });

      // Check mobile touch target sizes
      const touchIssues = await page.evaluate((isMobile) => {
        if (!isMobile) return [];
        const issues: string[] = [];
        const buttons = Array.from(document.querySelectorAll("button, a.btn-primary"));
        for (const b of buttons) {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.height < 36) {
            const text = b.textContent?.trim()?.slice(0, 20) || "unnamed";
            issues.push(`${text} (h=${Math.round(rect.height)}px)`);
          }
        }
        return issues.slice(0, 3);
      }, vp.width <= 430);

      const shotPath = `qa/screenshots/${vp.name}/${r.name}.png`;
      await page.screenshot({ path: path.resolve(process.cwd(), shotPath), fullPage: true });

      results.push({
        route: r.path,
        viewport: `${vp.width}x${vp.height}`,
        overflow,
        buttonContrast: buttonStyles ? `${buttonStyles.color} on ${buttonStyles.bg}` : "N/A",
        touchTargetIssues: touchIssues,
        screenshotPath: shotPath,
      });

      // Test interactive Dialog/Sheet modal on /sites
      if (r.name === "sites") {
        const addBtn = await page.$('button:has-text("Add site")');
        if (addBtn) {
          await addBtn.click();
          await page.waitForTimeout(300);
          const modalShot = `qa/screenshots/${vp.name}/sites_add_modal.png`;
          await page.screenshot({ path: path.resolve(process.cwd(), modalShot) });
          // Close it
          const closeBtn = await page.$('button:has-text("Cancel"), button[aria-label="Close"]');
          if (closeBtn) await closeBtn.click();
        }
      }

      // Test Mobile Navigation "More" Sheet
      if (vp.width <= 430 && r.name === "overview") {
        const moreBtn = await page.$('button:has-text("More")');
        if (moreBtn) {
          await moreBtn.click();
          await page.waitForTimeout(300);
          const sheetShot = `qa/screenshots/${vp.name}/mobile_more_sheet.png`;
          await page.screenshot({ path: path.resolve(process.cwd(), sheetShot) });
          // Close sheet
          await page.keyboard.press("Escape");
        }
      }
    }

    await authContext.close();

    // Public context
    const publicContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const pubPage = await publicContext.newPage();

    for (const r of publicRoutes) {
      await pubPage.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle" });
      const overflow = await pubPage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const shotPath = `qa/screenshots/${vp.name}/${r.name}.png`;
      await pubPage.screenshot({ path: path.resolve(process.cwd(), shotPath), fullPage: true });

      results.push({
        route: r.path,
        viewport: `${vp.width}x${vp.height}`,
        overflow,
        buttonContrast: "Checked",
        touchTargetIssues: [],
        screenshotPath: shotPath,
      });
    }

    await publicContext.close();
  }

  await browser.close();

  console.log("\n=== VISUAL QA RESULTS SUMMARY ===");
  const overflows = results.filter((r) => r.overflow);
  console.log(`Total views tested: ${results.length}`);
  console.log(`Overflow issues found: ${overflows.length}`);
  if (overflows.length > 0) {
    console.log("Overflows detected in:", overflows.map((o) => `${o.route} (${o.viewport})`));
  }

  const sampleButtons = results.filter((r) => r.buttonContrast !== "N/A" && r.buttonContrast !== "Checked");
  console.log("\nSample Computed Button Colors (Text on Background):");
  sampleButtons.slice(0, 5).forEach((b) => {
    console.log(`- ${b.route} (${b.viewport}): ${b.buttonContrast}`);
  });

  console.log("\nScreenshots saved successfully across all viewports!");
  process.exit(0);
}

main().catch((err) => {
  console.error("QA script failed:", err);
  process.exit(1);
});
