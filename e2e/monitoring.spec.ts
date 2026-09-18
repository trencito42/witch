import { test, expect } from "@playwright/test";

test("landing still states the core promise", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
  await expect(page.getByText("Missing checkout button")).toBeVisible();
  await expect(page.getByText("Broken mobile layout")).toBeVisible();
});
