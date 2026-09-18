import type { Page } from "playwright";
import { MONITORING_THRESHOLDS } from "@/lib/constants";

export type StabilizeResult = {
  stabilized: boolean;
  waitedMs: number;
  timedOut: boolean;
};

export async function stabilizePage(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<StabilizeResult> {
  const timeoutMs = options?.timeoutMs ?? MONITORING_THRESHOLDS.stabilizeBudgetMs;
  const started = Date.now();
  const remaining = () => Math.max(50, timeoutMs - (Date.now() - started));

  await page
    .waitForLoadState("networkidle", { timeout: Math.min(2_000, remaining()) })
    .catch(() => undefined);

  await page
    .evaluate(async () => {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) await fonts.ready.catch(() => undefined);
    })
    .catch(() => undefined);

  await page
    .addStyleTag({
      content: `*, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }`,
    })
    .catch(() => undefined);

  await page
    .evaluate(() => {
      document.querySelectorAll("video, audio").forEach((el) => {
        const media = el as HTMLMediaElement;
        media.pause();
        media.currentTime = 0;
        media.muted = true;
      });
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") ?? "";
        if (/\.gif(\?|$)/i.test(src)) img.style.visibility = "hidden";
      });
    })
    .catch(() => undefined);

  const settleMs = MONITORING_THRESHOLDS.layoutSettleMs;
  let last = "";
  let stableRounds = 0;
  let timedOut = false;
  for (let i = 0; i < MONITORING_THRESHOLDS.layoutSettleRounds; i += 1) {
    if (Date.now() - started >= timeoutMs) {
      timedOut = true;
      break;
    }
    const signature = await page
      .evaluate(() => {
        const body = document.body;
        return [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
          body?.getBoundingClientRect().height ?? 0,
          document.querySelectorAll("img").length,
          document.querySelectorAll("button,[role='button']").length,
        ].join(":");
      })
      .catch(() => "err");
    if (signature === last) {
      stableRounds += 1;
      if (stableRounds >= 2) break;
    } else {
      stableRounds = 0;
      last = signature;
    }
    await page.waitForTimeout(Math.min(settleMs, remaining()));
  }

  const waitedMs = Date.now() - started;
  return {
    stabilized: !timedOut && stableRounds >= 2,
    waitedMs,
    timedOut,
  };
}
