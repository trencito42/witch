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
  | "chat-widget"
  | "newsletter-popup"
  | "legitimate-modal"
  | "delayed-content"
  | "delayed-image"
  | "mobile-broken-layout"
  | "error-200"
  | "redirect"
  | "broken-stylesheet"
  | "recovery";

let current: FixtureState = "healthy";

function page(state: FixtureState) {
  const resolved = state === "recovery" ? "healthy" : state;
  let checkout = `<button class="checkout" data-cta="checkout">Checkout</button>`;
  if (resolved === "missing-button") {
    checkout = "";
  } else if (resolved === "delayed-content") {
    checkout = `
      <div id="checkout-container">
        <div id="skeleton" style="width:120px;height:36px;background:#e2e8f0;border-radius:6px;display:inline-block;">Loading...</div>
      </div>
      <script>
        setTimeout(() => {
          const container = document.getElementById("checkout-container");
          if (container) {
            container.innerHTML = '<button class="checkout" data-cta="checkout">Checkout</button>';
          }
        }, 800);
      </script>
    `;
  } else if (resolved === "mobile-broken-layout") {
    checkout = `
      <div class="checkout-wrapper">
        <style>
          @media (max-width: 600px) {
            .checkout-wrapper { display: none !important; }
          }
        </style>
        <button class="checkout" data-cta="checkout">Checkout</button>
      </div>
    `;
  }

  let hero = `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Hero" width="320" height="80" />`;
  if (resolved === "broken-image") {
    hero = `<img src="/missing-hero.jpg" alt="Hero" width="320" height="80" />`;
  } else if (resolved === "delayed-image") {
    hero = `
      <div id="hero-container">
        <img id="delayed-hero" src="/assets/delayed-hero.png" alt="Hero" width="320" height="80" />
      </div>
    `;
  }

  const cssHref = resolved === "broken-stylesheet" || resolved === "broken-css" ? "/assets/missing.css" : "/assets/app.css";
  const jsHref = resolved === "failed-js" ? "/assets/missing.js" : "/assets/app.js";
  const errorScript = resolved === "javascript-error" ? `<script>throw new Error("fixture-js-error");</script>` : "";
  const overflow = resolved === "mobile-overflow" || resolved === "broken-layout";
  const offscreen = resolved === "offscreen" ? "position:absolute;left:-9999px;" : "";
  const large = resolved === "large-visual" ? "background:#c0392b;color:#fff;min-height:70vh;" : "";
  const noise = resolved === "tiny-noise" ? `<span style="color:#f7f7f7">.</span>` : "";
  const stamp = resolved === "timestamp" ? `<time datetime="2026-01-01">${Date.now()}</time>` : "";

  let banner = "";
  if (resolved === "cookie-banner") {
    banner = `
      <div id="cookie-banner" style="position:fixed;bottom:0;left:0;right:0;background:#18181b;color:#f4f4f5;padding:16px;z-index:9999;box-shadow:0 -4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:between;gap:12px;">
        <div>We use cookies to enhance your browsing experience and analyze site traffic.</div>
        <div style="display:flex;gap:8px;">
          <button id="reject-cookies" style="padding:6px 12px;background:#3f3f46;color:#fff;border:none;border-radius:4px;cursor:pointer;">Reject all</button>
          <button id="accept-cookies" style="padding:6px 12px;background:#22c55e;color:#000;border:none;border-radius:4px;cursor:pointer;">Accept all</button>
        </div>
      </div>
    `;
  } else if (resolved === "chat-widget") {
    banner = `
      <div id="crisp-chatbox" style="position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:28px;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:9998;cursor:pointer;">
        Chat
      </div>
    `;
  } else if (resolved === "newsletter-popup") {
    banner = `
      <div id="newsletter-modal" role="dialog" style="position:fixed;top:20%;left:50%;transform:translateX(-50%);width:380px;background:#fff;color:#000;padding:24px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.3);z-index:10000;">
        <h3>Subscribe to our newsletter</h3>
        <p>Get 10% off your first purchase</p>
        <form>
          <input type="email" name="email" placeholder="you@domain.com" style="width:100%;padding:8px;margin-bottom:8px;" />
          <button type="button" style="padding:8px 16px;background:#000;color:#fff;border:none;border-radius:4px;">Subscribe</button>
        </form>
      </div>
    `;
  } else if (resolved === "legitimate-modal") {
    banner = `
      <div id="error-dialog" role="alertdialog" style="position:fixed;top:20%;left:50%;transform:translateX(-50%);width:400px;background:#fef2f2;border:2px solid #ef4444;color:#991b1b;padding:24px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.3);z-index:10000;">
        <h3 style="margin-top:0;">Payment failed</h3>
        <p>Your card was declined by the payment processor. Checkout unavailable.</p>
        <button type="button" style="padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:4px;">Retry Payment</button>
      </div>
    `;
  }

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
  if (url.pathname === "/assets/delayed-hero.png") {
    await new Promise((r) => setTimeout(r, 400));
    const transparent1px = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
    res.writeHead(200, { "content-type": "image/png" });
    res.end(transparent1px);
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
