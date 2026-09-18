import { chromium, type Browser, type BrowserContext } from "playwright";
import { getEnv } from "@/lib/env";
import { VIEWPORTS, MAX_CONSOLE_EVENTS, MAX_FAILED_REQUESTS, MAX_SNAPSHOT_BYTES } from "@/lib/constants";
import { assertPublicHttpUrl, sanitizeUrlForLog, UnsafeUrlError } from "@/lib/safe-url";
import { extractDomSignals, type DomSignals } from "./dom";

export type BrowserCheckResult = {
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  statusCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  screenshot: Buffer | null;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: { url: string; status: number | null; method: string }[];
  responses400: { url: string; status: number }[];
  navigationTiming: Record<string, number> | null;
  dom: DomSignals | null;
  elementFound?: boolean;
  elementText?: string | null;
};

let browserPromise: Promise<Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const env = getEnv();
    browserPromise = chromium.launch({
      headless: env.PLAYWRIGHT_HEADLESS !== false,
      executablePath: env.PLAYWRIGHT_CHROMIUM_PATH,
      args: [
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-translate",
        "--no-first-run",
        "--disable-features=Translate,BackForwardCache",
      ],
    });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

async function allowRequest(url: string) {
  try {
    if (url.startsWith("data:") || url.startsWith("blob:")) return true;
    await assertPublicHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}

export async function runBrowserCheck(input: {
  url: string;
  viewport: "desktop" | "mobile";
  selector?: string | null;
  expectedText?: string | null;
}): Promise<BrowserCheckResult> {
  const startedAt = new Date();
  const env = getEnv();
  const viewport = VIEWPORTS[input.viewport];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: BrowserCheckResult["failedRequests"] = [];
  const responses400: BrowserCheckResult["responses400"] = [];

  let context: BrowserContext | null = null;
  try {
    const validated = await assertPublicHttpUrl(input.url);
    const browser = await getBrowser();
    context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      javaScriptEnabled: true,
      acceptDownloads: false,
      ignoreHTTPSErrors: false,
      bypassCSP: false,
      permissions: [],
      colorScheme: "light",
      userAgent: `Mozilla/5.0 (compatible; WitchMonitor/1.0; +https://witch.pw) ${
        input.viewport === "mobile"
          ? "Mobile"
          : "Desktop"
      }`,
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.8" },
    });
    context.setDefaultTimeout(env.BROWSER_CHECK_TIMEOUT_MS);
    context.setDefaultNavigationTimeout(Math.min(env.BROWSER_CHECK_TIMEOUT_MS, 25_000));
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = request.url();
      const resourceType = request.resourceType();
      if (["media", "font"].includes(resourceType) && failedRequests.length > MAX_FAILED_REQUESTS) {
        await route.abort("blockedbyclient");
        return;
      }
      if (!(await allowRequest(url))) {
        await route.abort("blockedbyclient");
        return;
      }
      if (request.failure()?.errorText === "net::ERR_TOO_MANY_REDIRECTS") {
        await route.abort();
        return;
      }
      await route.continue();
    });

    const page = await context.newPage();
    page.setDefaultTimeout(env.BROWSER_CHECK_TIMEOUT_MS);
    page.on("console", (msg) => {
      if (msg.type() === "error" && consoleErrors.length < MAX_CONSOLE_EVENTS) {
        consoleErrors.push(msg.text().slice(0, 400));
      }
    });
    page.on("pageerror", (error) => {
      if (pageErrors.length < MAX_CONSOLE_EVENTS) {
        pageErrors.push(error.message.slice(0, 400));
      }
    });
    page.on("requestfailed", (request) => {
      if (failedRequests.length < MAX_FAILED_REQUESTS) {
        failedRequests.push({
          url: sanitizeUrlForLog(request.url()),
          status: null,
          method: request.method(),
        });
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && responses400.length < MAX_FAILED_REQUESTS) {
        responses400.push({
          url: sanitizeUrlForLog(response.url()),
          status: response.status(),
        });
        if (response.status() >= 400) {
          failedRequests.push({
            url: sanitizeUrlForLog(response.url()),
            status: response.status(),
            method: response.request().method(),
          });
        }
      }
    });

    const response = await page.goto(validated.href, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(env.BROWSER_CHECK_TIMEOUT_MS, 25_000),
    });
    await page.waitForTimeout(1200);

    let elementFound: boolean | undefined;
    let elementText: string | null | undefined;
    if (input.selector) {
      const loc = page.locator(input.selector).first();
      const count = await loc.count();
      elementFound = count > 0 && (await loc.isVisible().catch(() => false));
      elementText = elementFound ? (await loc.innerText().catch(() => "")).slice(0, 300) : null;
      if (input.expectedText && elementText) {
        elementFound = elementText.toLowerCase().includes(input.expectedText.toLowerCase());
      }
    } else if (input.expectedText) {
      const loc = page.getByText(input.expectedText, { exact: false }).first();
      elementFound = (await loc.count()) > 0;
      elementText = elementFound ? input.expectedText : null;
    }

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      animations: "disabled",
      timeout: 10_000,
    });
    const clipped =
      screenshot.byteLength > MAX_SNAPSHOT_BYTES
        ? screenshot.subarray(0, MAX_SNAPSHOT_BYTES)
        : screenshot;

    const dom = (await page.evaluate(extractDomSignals)) as DomSignals;
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return null;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
        response: Math.round(nav.responseEnd),
      };
    });

    const completedAt = new Date();
    const statusCode = response?.status() ?? null;
    return {
      success: Boolean(response && statusCode && statusCode < 400),
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      statusCode,
      errorCode: null,
      errorMessage: null,
      finalUrl: page.url(),
      pageTitle: await page.title(),
      screenshot: Buffer.from(clipped),
      consoleErrors: unique(consoleErrors.concat(pageErrors)),
      pageErrors,
      failedRequests: uniqueFailed(failedRequests),
      responses400,
      navigationTiming: timing,
      dom,
      elementFound,
      elementText,
    };
  } catch (error) {
    const completedAt = new Date();
    const message = error instanceof Error ? error.message : "Browser check failed";
    let errorCode = "BROWSER_FAILURE";
    if (error instanceof UnsafeUrlError) errorCode = "UNSAFE_URL";
    if (message.toLowerCase().includes("timeout")) errorCode = "TIMEOUT";
    if (message.toLowerCase().includes("net::err_cert") || message.toLowerCase().includes("ssl")) {
      errorCode = "SSL_ERROR";
    }
    if (message.toLowerCase().includes("err_name_not_resolved")) errorCode = "DNS_FAILURE";
    return {
      success: false,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      statusCode: null,
      errorCode,
      errorMessage: message.slice(0, 500),
      finalUrl: null,
      pageTitle: null,
      screenshot: null,
      consoleErrors,
      pageErrors,
      failedRequests: uniqueFailed(failedRequests),
      responses400,
      navigationTiming: null,
      dom: null,
    };
  } finally {
    if (context) await context.close();
  }
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.slice(0, 400)))].slice(0, MAX_CONSOLE_EVENTS);
}

function uniqueFailed(items: BrowserCheckResult["failedRequests"]) {
  const seen = new Set<string>();
  const output: BrowserCheckResult["failedRequests"] = [];
  for (const item of items) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
    if (output.length >= MAX_FAILED_REQUESTS) break;
  }
  return output;
}
