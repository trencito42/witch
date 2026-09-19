import { test, expect } from "@playwright/test";

for (const viewport of [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  test(`landing page is responsive on ${viewport.name}`, async ({ page }) => {
    test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /your site can be online and completely broken/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Monitor your first site" })).toBeVisible();
    await expect(page.getByText("Detection, not decoration")).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("[SITE]");
    expect(body).not.toContain("[CAUSE]");
    expect(body).not.toContain("[DURATION]");
    expect(body).not.toContain("[FOUNDER_NAME]");
  });
}

test("login form is real", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
