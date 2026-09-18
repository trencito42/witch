import { test, expect } from "@playwright/test";

test("landing still states the core promise", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uptime tells you/i })).toBeVisible();
  await expect(page.getByText("Missing checkout button")).toBeVisible();
  await expect(page.getByText("Broken mobile layout")).toBeVisible();
});
