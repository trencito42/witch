import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start monitoring" }).first()).toBeVisible();
});

test("signup form is real", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
