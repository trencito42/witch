import http from "node:http";

const port = Number(process.env.FIXTURE_PORT ?? 3456);

export type FixtureState =
  | "healthy"
  | "http-500"
  | "slow"
  | "missing-button"
  | "missing-text"
  | "broken-image"
  | "failed-js"
  | "javascript-error"
  | "broken-css"
  | "broken-layout"
  | "mobile-overflow"
  | "offscreen"
  | "large-visual"
  | "tiny-noise"
  | "timestamp"
  | "cookie-banner"
  | "error-200"
  | "redirect"
  | "broken-stylesheet"
  | "recovery";

let current: FixtureState = "healthy";

function page(state: FixtureState) {
  const resolved = state === "recovery" ? "healthy" : state;
  const checkout = resolved === "missing-button" ? "" : `<button class="checkout" data-cta="checkout">Checkout</button>`;
  const hero =
    resolved === "broken-image"
      ? `<img src="/missing-hero.jpg" alt="Hero" width="320" height="80" />`
      : `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Hero" width="320" height="80" />`;
  const cssHref = resolved === "broken-stylesheet" || resolved === "broken-css" ? "/assets/missing.css" : "/assets/app.css";
  const jsHref = resolved === "failed-js" ? "/assets/missing.js" : "/assets/app.js";
  const errorScript = resolved === "javascript-error" ? `<script>throw new Error("fixture-js-error");</script>` : "";
  const overflow = resolved === "mobile-overflow" || resolved === "broken-layout";
  const offscreen = resolved === "offscreen" ? "position:absolute;left:-9999px;" : "";
  const large = resolved === "large-visual" ? "background:#c0392b;color:#fff;min-height:70vh;" : "";
  const noise = resolved === "tiny-noise" ? `<span style="color:#f7f7f7">.</span>` : "";
  const stamp = resolved === "timestamp" ? `<time datetime="2026-01-01">${Date.now()}</time>` : "";
  const banner =
    resolved === "cookie-banner"
      ? `<div id="cookie-banner" style="position:fixed;bottom:0;left:0;right:0;background:#111;color:#fff;padding:12px;">Cookies</div>`
      : "";
  const bodyCopy =
    resolved === "missing-text"
      ? ""
      : resolved === "error-200"
        ? `<h1>Internal Server Error</h1><p>Something went wrong</p>`
        : `<h1>Store</h1><p>Welcome to the store</p>`;
  const extraWidth = overflow ? "width:1200px;margin-left:0;" : "";
  return `<!doctype html>
<html><head>
  <title>${resolved === "error-200" ? "Error" : "Witch fixture"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="${cssHref}" />
</head>
<body style="font-family:sans-serif;padding:24px;${extraWidth}${large}">
  ${bodyCopy}
  <form name="cart">${checkout}</form>
  ${hero}
  <button style="${offscreen}">Hidden control</button>
  ${stamp}${noise}${banner}
  <script src="${jsHref}"></script>
  ${errorScript}
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/control") {
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = JSON.parse(Buffer.concat(chunks).toString() || "{}") as { state?: FixtureState };
      if (body.state) current = body.state;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ state: current }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ state: current }));
    return;
  }
  if (url.pathname === "/assets/app.css") {
    res.writeHead(200, { "content-type": "text/css" });
    res.end("body{margin:0}");
    return;
  }
  if (url.pathname === "/assets/app.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end("window.__fixture=true;");
    return;
  }
  if (url.pathname.startsWith("/assets/missing")) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("missing asset");
    return;
  }
  const queryState = url.searchParams.get("state") as FixtureState | null;
  const state = queryState ?? current;
  if (state === "slow") {
    await new Promise((r) => setTimeout(r, 4000));
  }
  if (state === "http-500") {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("fixture 500");
    return;
  }
  if (state === "redirect") {
    res.writeHead(302, { location: "/?state=healthy" });
    res.end();
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page(state));
});

if (process.argv[1]?.includes("fixture-server")) {
  server.listen(port, "127.0.0.1", () => {
    console.log(`fixture listening on http://127.0.0.1:${port}`);
  });
}

export { server, page };
