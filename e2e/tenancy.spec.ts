import { test, expect } from "@playwright/test";

test("snapshot media is not public", async ({ request }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  const response = await request.get("/api/media/snapshot/not-a-real-id");
  expect([401, 403, 404]).toContain(response.status());
  expect(response.headers()["content-type"] ?? "").not.toMatch(/image\//);
});

test("diff media is not public", async ({ request }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  const response = await request.get("/api/media/diff/not-a-real-id");
  expect([401, 403, 404]).toContain(response.status());
});
