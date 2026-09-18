import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server } from "../../scripts/fixture-server";

const port = 3457;

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => resolve());
    server.once("error", reject);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("fixture server", () => {
  it("serves a healthy checkout CTA", async () => {
    const html = await (await fetch(`http://127.0.0.1:${port}/?state=healthy`)).text();
    expect(html).toContain("Checkout");
    expect(html).toContain("Welcome to the store");
  });

  it("can hide the CTA", async () => {
    const html = await (await fetch(`http://127.0.0.1:${port}/?state=missing-button`)).text();
    expect(html).not.toContain("Checkout");
  });

  it("returns HTTP 500", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/?state=http-500`);
    expect(response.status).toBe(500);
  });

  it("renders an error page with HTTP 200", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/?state=error-200`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Internal Server Error");
  });

  it("creates mobile overflow width", async () => {
    const html = await (await fetch(`http://127.0.0.1:${port}/?state=mobile-overflow`)).text();
    expect(html).toContain("width:1200px");
  });

  it("switches via control API", async () => {
    await fetch(`http://127.0.0.1:${port}/control`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: "broken-image" }),
    });
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    expect(html).toContain("/missing-hero.jpg");
  });
});
