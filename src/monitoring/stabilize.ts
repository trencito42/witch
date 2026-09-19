import type { Page } from "playwright";
import { MONITORING_THRESHOLDS } from "@/lib/constants";

export type StabilizeResult = {
  stabilized: boolean;
  waitedMs: number;
  documentComplete: boolean;
  fontsReady: boolean;
  visibleImagesReady: boolean;
  networkQuiet: boolean;
  layoutStable: boolean;
  timedOut: boolean;
  brokenVisibleImages: string[];
  reason?: string;
};

export async function stabilizePage(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<StabilizeResult> {
  const timeoutMs = options?.timeoutMs ?? Math.min(8_000, MONITORING_THRESHOLDS.stabilizeBudgetMs || 8_000);
  const started = Date.now();
  const remaining = () => Math.max(50, timeoutMs - (Date.now() - started));

  let documentComplete = false;
  let fontsReady = false;
  let visibleImagesReady = false;
  let networkQuiet = false;
  let layoutStable = false;
  let timedOut = false;
  let brokenVisibleImages: string[] = [];

  // Stage 1: Wait for document.readyState === "complete"
  try {
    await page.waitForFunction(
      () => document.readyState === "complete",
      { timeout: Math.min(2_500, remaining()) },
    );
    documentComplete = true;
  } catch {
    documentComplete = false;
  }

  // Stage 2: Attempt page "load" state
  if (remaining() > 100) {
    await page
      .waitForLoadState("load", { timeout: Math.min(2_000, remaining()) })
      .catch(() => undefined);
  }

  // Stage 3: Web fonts readiness
  if (remaining() > 100) {
    try {
      await page.evaluate(async () => {
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        if (fonts?.ready) await fonts.ready.catch(() => undefined);
      });
      fontsReady = true;
    } catch {
      fontsReady = false;
    }
  }

  // Stage 4: Viewport visible images readiness
  const imagePollStart = Date.now();
  while (Date.now() - imagePollStart < Math.min(2_500, remaining())) {
    try {
      const imgStatus = await page.evaluate(() => {
        const visible = Array.from(document.querySelectorAll("img")).filter((img) => {
          const r = img.getBoundingClientRect();
          return (
            r.top < window.innerHeight &&
            r.bottom > 0 &&
            r.left < window.innerWidth &&
            r.right > 0 &&
            r.width > 0 &&
            r.height > 0
          );
        });
        const broken: string[] = [];
        let allComplete = true;
        for (const img of visible) {
          if (!img.complete) {
            allComplete = false;
          } else if (img.naturalWidth === 0 && img.src && !img.src.startsWith("data:")) {
            broken.push(img.src.slice(0, 160));
          }
        }
        return { allComplete, broken };
      });
      brokenVisibleImages = imgStatus.broken;
      if (imgStatus.allComplete) {
        visibleImagesReady = true;
        break;
      }
    } catch {
      break;
    }
    await page.waitForTimeout(100);
  }

  // Stage 5: Bounded network quiet window
  if (remaining() > 100) {
    try {
      await page.waitForLoadState("networkidle", { timeout: Math.min(1_500, remaining()) });
      networkQuiet = true;
    } catch {
      // Non-critical: analytics or periodic pings may keep network alive
      networkQuiet = false;
    }
  }

  // Stage 6: Layout stability sampling (multi-round)
  const settleMs = Math.min(180, Math.max(80, MONITORING_THRESHOLDS.layoutSettleMs || 150));
  let lastSignature = "";
  let stableRounds = 0;
  for (let i = 0; i < 5; i += 1) {
    if (Date.now() - started >= timeoutMs) {
      timedOut = true;
      break;
    }
    const signature = await page
      .evaluate(() => {
        const body = document.body;
        const rect = body?.getBoundingClientRect();
        const mainButtons = Array.from(document.querySelectorAll("button, a[role='button']"))
          .slice(0, 8)
          .map((b) => {
            const r = b.getBoundingClientRect();
            return `${Math.round(r.top)},${Math.round(r.left)}`;
          })
          .join(";");
        return [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
          Math.round(rect?.height ?? 0),
          Math.round(rect?.width ?? 0),
          document.querySelectorAll("img").length,
          mainButtons,
        ].join(":");
      })
      .catch(() => "err");

    if (signature === lastSignature && signature !== "err") {
      stableRounds += 1;
      if (stableRounds >= 2) {
        layoutStable = true;
        break;
      }
    } else {
      stableRounds = 0;
      lastSignature = signature;
    }
    await page.waitForTimeout(Math.min(settleMs, remaining()));
  }

  // Stage 7: Short final settle period after stability
  if (layoutStable && remaining() > 200) {
    await page.waitForTimeout(Math.min(200, remaining()));
  }

  // Stage 8: Freeze animations, transitions, and media
  await page
    .addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        html { scroll-behavior: auto !important; }
      `,
    })
    .catch(() => undefined);

  await page
    .evaluate(() => {
      document.querySelectorAll("video, audio").forEach((el) => {
        const media = el as HTMLMediaElement;
        try {
          media.pause();
          media.currentTime = 0;
          media.muted = true;
        } catch {}
      });
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") ?? "";
        if (/\.gif(\?|$)/i.test(src)) img.style.visibility = "hidden";
      });
    })
    .catch(() => undefined);

  const waitedMs = Date.now() - started;
  const stabilized = !timedOut && layoutStable && (documentComplete || fontsReady);

  let reason = "Fully stabilized";
  if (timedOut) {
    reason = "Readiness budget exceeded (timeout)";
  } else if (!layoutStable) {
    reason = "Layout shifts did not settle within budget";
  } else if (!networkQuiet) {
    reason = "Captured before full network quiet (background requests active)";
  }

  return {
    stabilized,
    waitedMs,
    documentComplete,
    fontsReady,
    visibleImagesReady,
    networkQuiet,
    layoutStable,
    timedOut,
    brokenVisibleImages,
    reason,
  };
}
