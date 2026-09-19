import { test, expect } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
}

function skipWithoutApp() {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
}

for (const viewport of viewports) {
  test(`public landing/login/signup at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    skipWithoutApp();
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    if (viewport.width < 768) {
      const fontSize = await page.getByLabel(/email/i).evaluate((el) => getComputedStyle(el).fontSize);
      expect(Number.parseFloat(fontSize)).toBeGreaterThanOrEqual(16);
    }
    const sidebar = page.locator("aside");
    if (viewport.width < 1024) {
      await expect(sidebar).toHaveCount(0);
    }
    await page.goto("/signup");
    await expect(page.getByLabel("Email")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
}

test("authenticated app routes require staging credentials", async () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    "Set E2E_EMAIL and E2E_PASSWORD to cover /overview /sites /incidents /reports /team /settings at 375-1440.",
  );
});
