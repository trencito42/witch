import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { server } from "../scripts/fixture-server";

const fixturePort = Number(process.env.FIXTURE_PORT ?? 3456);

test.beforeAll(async () => {
  if (server.listening) return;
  await new Promise<void>((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") resolve();
      else reject(error);
    };
    server.once("error", onError);
    server.listen(fixturePort, "127.0.0.1", () => resolve());
  });
});

test("healthy fixture still returns HTTP 200 with checkout CTA", async ({ request }) => {
  const response = await request.get(`http://127.0.0.1:${fixturePort}/`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Checkout");
});

test("broken fixture remains HTTP 200 without checkout CTA", async ({ request }) => {
  const response = await request.get(`http://127.0.0.1:${fixturePort}/?state=missing-button`);
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain("Checkout");
});

test("authenticated monitor→incident→recovery pipeline", async () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for the real pipeline.");
  test.setTimeout(360_000);
  const result = spawnSync(
    "npx",
    ["tsx", "--require", "./worker/register-server-only.cjs", "scripts/e2e-pipeline.ts"],
    { encoding: "utf8", env: { ...process.env, FIXTURE_ENABLED: "true" }, timeout: 330_000 },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "pipeline script failed");
  }
  const line = result.stdout.split("\n").find((row) => row.startsWith("E2E_PIPELINE_RESULT "));
  expect(line).toBeTruthy();
  const payload = JSON.parse(line!.slice("E2E_PIPELINE_RESULT ".length));
  expect(payload.ok).toBe(true);
  expect(payload.resolved).toBe(true);
  expect(payload.snapshots).toBeGreaterThanOrEqual(2);
});
