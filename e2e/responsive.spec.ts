import { test, expect } from "@playwright/test";
import { devices } from "@playwright/test";

test("landing remains usable at 390px", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.setViewportSize(devices["iPhone 12"].viewport);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free monitoring" }).first()).toBeVisible();
});

test("login remains usable at 768px", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
