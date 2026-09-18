import http from "node:http";

const port = Number(process.env.FIXTURE_PORT ?? 3456);

type State =
  | "healthy"
  | "broken-layout"
  | "missing-button"
  | "broken-image"
  | "javascript-error"
  | "http-500"
  | "slow";

function html(state: State) {
  const cta = state === "missing-button" ? "" : `<button class="checkout">Checkout</button>`;
  const layout = state === "broken-layout" ? "margin-left:480px;" : "";
  const img =
    state === "broken-image"
      ? `<img src="/missing-hero.jpg" alt="Hero" />`
      : `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Hero" />`;
  const script =
    state === "javascript-error"
      ? `<script>throw new Error("fixture-js-error");</script>`
      : "";
  return `<!doctype html>
<html><head><title>Witch fixture</title></head>
<body style="font-family:sans-serif;padding:24px;${layout}">
  <h1>Store</h1>
  <form name="cart">${cta}</form>
  ${img}
  <p>Welcome to the store</p>
  ${script}
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  const state = (url.searchParams.get("state") ?? "healthy") as State;
  if (state === "slow") {
    await new Promise((r) => setTimeout(r, 4000));
  }
  if (state === "http-500") {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("fixture 500");
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html(state));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`fixture listening on http://127.0.0.1:${port}`);
});
