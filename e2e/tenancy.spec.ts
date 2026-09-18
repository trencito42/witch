import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";

test("snapshot media requires a session before lookup", async ({ request }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  const missing = await request.get("/api/media/snapshot/not-a-real-id");
  expect(missing.status()).toBe(401);
  expect(missing.headers()["content-type"] ?? "").not.toMatch(/image\//);
});

test("diff media requires a session before lookup", async ({ request }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER) && !process.env.PLAYWRIGHT_BASE_URL, "app server not started");
  const response = await request.get("/api/media/diff/not-a-real-id");
  expect(response.status()).toBe(401);
});

test("Org B cannot read Org A snapshot IDs", async () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for real tenant isolation.");
  test.setTimeout(120_000);
  const result = spawnSync(
    "npx",
    ["tsx", "--require", "./worker/register-server-only.cjs", "scripts/e2e-tenancy.ts"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL:
          process.env.PLAYWRIGHT_BASE_URL ||
          (process.env.PLAYWRIGHT_SKIP_WEBSERVER ? "" : "http://127.0.0.1:3003"),
      },
      timeout: 90_000,
    },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "tenancy script failed");
  }
  const line = result.stdout.split("\n").find((row) => row.startsWith("E2E_TENANCY_RESULT "));
  expect(line).toBeTruthy();
  const payload = JSON.parse(line!.slice("E2E_TENANCY_RESULT ".length));
  expect(payload.ok).toBe(true);
  expect(payload.membershipDenied).toBe(true);
});
