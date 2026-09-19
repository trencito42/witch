import { test, expect } from "@playwright/test";

test("landing page renders truthful product positioning", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /your site can be online and completely broken/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Monitor your first site" })).toBeVisible();
  await expect(page.getByText("Fixture replay")).toBeVisible();

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("[SITE]");
  expect(body).not.toContain("[CAUSE]");
  expect(body).not.toContain("[DURATION]");
  expect(body).not.toContain("[FOUNDER_NAME]");
});

test("login form is real", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
