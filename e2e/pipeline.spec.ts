import { test, expect } from "@playwright/test";
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

test("authenticated monitor→incident pipeline requires staging credentials", async () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD || !process.env.DATABASE_URL,
    "Set E2E_EMAIL, E2E_PASSWORD, and DATABASE_URL to run the authenticated pipeline against a staging workspace.",
  );
});
