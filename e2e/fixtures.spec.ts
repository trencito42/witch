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

test("fixture missing CTA is deterministic", async ({ request }) => {
  const html = await (await request.get(`http://127.0.0.1:${fixturePort}/?state=missing-button`)).text();
  expect(html).toContain("Store");
  expect(html).not.toContain("Checkout");
});

test("fixture mobile overflow includes a wider than viewport block", async ({ request }) => {
  const html = await (await request.get(`http://127.0.0.1:${fixturePort}/?state=mobile-overflow`)).text();
  expect(html).toContain("width:1200px");
});

test("fixture error page still returns HTTP 200", async ({ request }) => {
  const response = await request.get(`http://127.0.0.1:${fixturePort}/?state=error-200`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Internal Server Error");
});
