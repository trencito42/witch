import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start monitoring" }).first()).toBeVisible();
});

test("login form is real", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
