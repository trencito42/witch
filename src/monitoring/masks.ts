import { MONITORING_THRESHOLDS } from "@/lib/constants";
import type { IgnoreRegion } from "./regions";
import { DEFAULT_VISUAL_NOISE_CONFIG, type VisualNoiseConfig } from "./noise";

export const AUTO_IGNORE_SELECTORS = [
  "iframe[src*='youtube']",
  "iframe[src*='vimeo']",
  "video",
  "canvas",
  "time",
  "[datetime]",
  "[class*='clock' i]",
  "[data-live-clock]",
];

export type CollectorArgs = {
  selectors: string[];
  maxRatio: number;
  maxRegions: number;
  config: VisualNoiseConfig;
};

export function ignoreRegionCollectorArgs(
  extraSelectors: string[] = [],
  noiseConfig?: Partial<VisualNoiseConfig>,
): CollectorArgs {
  const mergedConfig: VisualNoiseConfig = {
    ...DEFAULT_VISUAL_NOISE_CONFIG,
    ...noiseConfig,
    customSelectors: [...(noiseConfig?.customSelectors ?? []), ...extraSelectors],
  };

  return {
    selectors: [...AUTO_IGNORE_SELECTORS, ...(mergedConfig.customSelectors ?? [])],
    maxRatio: MONITORING_THRESHOLDS.maxAutoMaskViewportRatio,
    maxRegions: MONITORING_THRESHOLDS.maxAutoMaskRegions,
    config: mergedConfig,
  };
}

export function collectIgnoreRegionsInPage(input: CollectorArgs): IgnoreRegion[] {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const maxArea = viewport.width * viewport.height * input.maxRatio;
  const regions: IgnoreRegion[] = [];
  const seen = new Set<string>();

  function isLegitimateNotice(el: Element): boolean {
    if (!el) return false;
    const text = ((el as HTMLElement).innerText || el.textContent || "").toLowerCase();
    const forbiddenTerms = [
      "checkout unavailable",
      "payment failed",
      "payment error",
      "order failed",
      "session expired",
      "site maintenance",
      "service unavailable",
      "error occurred",
      "access denied",
      "403 forbidden",
      "404 not found",
      "internal server error",
      "unauthorized",
    ];
    for (const term of forbiddenTerms) {
      if (text.includes(term)) return true;
    }
    if (el.querySelector("input[name*='card'], input[name*='cvv'], button[data-cta='checkout'], form[name='cart']")) {
      return true;
    }
    return false;
  }

  function addRegion(el: Element, source: string, reason: string) {
    if (!el || typeof el.getBoundingClientRect !== "function") return;
    if (isLegitimateNotice(el)) return;

    const rect = (el as HTMLElement).getBoundingClientRect?.();
    if (!rect || rect.width < 12 || rect.height < 12) return;
    if (rect.bottom < 0 || rect.right < 0 || rect.top > viewport.height || rect.left > viewport.width) {
      return;
    }

    const box: IgnoreRegion = {
      x: Math.max(0, Math.floor(rect.left)),
      y: Math.max(0, Math.floor(rect.top)),
      width: Math.min(viewport.width, Math.ceil(rect.width)),
      height: Math.min(viewport.height, Math.ceil(rect.height)),
      reason: (reason || source).slice(0, 80),
      source,
    };

    if (box.width * box.height > maxArea) return;
    const key = `${box.x}:${box.y}:${box.width}:${box.height}`;
    if (seen.has(key)) return;
    seen.add(key);
    regions.push(box);

    if (input.config.cleanCapture) {
      try {
        (el as HTMLElement).style?.setProperty("display", "none", "important");
        el.setAttribute("data-witch-clean-hidden", "true");
      } catch {}
    }
  }

  const config = input.config;

  // 1. COOKIE CONSENT BANNERS & CMPs
  if (config.ignoreCookieConsent) {
    const cmpSelectors = [
      "#onetrust-banner-sdk",
      "#onetrust-consent-sdk",
      "#CybotCookiebotDialog",
      "#didomi-popup",
      "#didomi-host",
      "#truste-consent-track",
      "#qc-cmp2-container",
      "#iubenda-cs-banner",
      ".cmplz-cookiebanner",
      "#cookieyes-banner",
      "#usercentrics-root",
      ".klaro",
      "#termly-code-snippet-support",
      "#cookie-banner",
      "[data-testid*='cookie-banner' i]",
      "[id*='cookie-banner' i]",
      "[class*='cookie-banner' i]",
      "[id*='cookie-consent' i]",
      "[class*='cookie-consent' i]",
      "[id*='consent-banner' i]",
    ];

    for (const sel of cmpSelectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          addRegion(el, "cookie", sel);
        });
      } catch {}
    }

    // Generic consent: fixed/sticky elements near bottom/top with consent text
    const fixedCandidates = document.querySelectorAll(
      "[role='dialog'], [role='alertdialog'], [role='region'], div, section",
    );
    for (const el of Array.from(fixedCandidates)) {
      if (isLegitimateNotice(el)) continue;
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;

      const text = ((el as HTMLElement).innerText || "").toLowerCase();
      const hasConsentKeywords =
        (text.includes("cookie") || text.includes("consent") || text.includes("privacy")) &&
        (text.includes("accept") || text.includes("agree") || text.includes("preferences") || text.includes("allow"));

      if (hasConsentKeywords && text.length < 1500) {
        addRegion(el, "cookie", "fixed-consent-heuristic");
      }
    }
  }

  // 2. CHAT WIDGETS
  if (config.ignoreChatWidgets) {
    const chatSelectors = [
      "#intercom-container",
      ".intercom-lightweight-app",
      "iframe[name*='intercom']",
      "#crisp-chatbox",
      ".crisp-client",
      "#drift-widget",
      "iframe#drift-widget",
      "#launcher",
      "iframe#webWidget",
      "#hubspot-messages-iframe-container",
      "#chat-widget-container",
      "[id*='tawk' i]",
      "[class*='chat-widget' i]",
      "[id*='chat-widget' i]",
      "button[aria-label*='chat' i]",
      "button[aria-label*='support' i]",
    ];
    for (const sel of chatSelectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          addRegion(el, "chat", sel);
        });
      } catch {}
    }
  }

  // 3. MARKETING / NEWSLETTER POPUPS
  if (config.ignoreMarketingPopups) {
    const modalCandidates = document.querySelectorAll("[role='dialog'], .modal, [class*='popup' i]");
    for (const el of Array.from(modalCandidates)) {
      if (isLegitimateNotice(el)) continue;
      const text = ((el as HTMLElement).innerText || "").toLowerCase();
      const hasNewsletterTerms =
        (text.includes("newsletter") || text.includes("subscribe") || text.includes("discount") || text.includes("% off")) &&
        el.querySelector("input[type='email'], input[name*='email' i]");

      if (hasNewsletterTerms && !el.querySelector("input[type='password']")) {
        addRegion(el, "marketing", "newsletter-popup-heuristic");
      }
    }
  }

  // 4. AD CONTAINERS
  if (config.ignoreAds) {
    const adSelectors = [
      "ins.adsbygoogle",
      "[id^='google_ads_']",
      "[id^='div-gpt-ad']",
      "[class*='advertisement' i]",
      "[class*='ad-container' i]",
      "[data-ad-slot]",
    ];
    for (const sel of adSelectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          addRegion(el, "ad", sel);
        });
      } catch {}
    }
  }

  // 5. STICKY PROMOTIONAL BANNERS
  if (config.ignoreStickyPromos) {
    const fixedBars = document.querySelectorAll("header, div, section");
    for (const el of Array.from(fixedBars)) {
      if (isLegitimateNotice(el)) continue;
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      const rect = el.getBoundingClientRect();
      if (rect.height > 90) continue;

      const text = ((el as HTMLElement).innerText || "").toLowerCase();
      const isPromo =
        (text.includes("free shipping") || text.includes("code:") || text.includes("discount") || text.includes("promo")) &&
        !el.querySelector("nav, [role='navigation']");

      if (isPromo) {
        addRegion(el, "promo", "sticky-promo-heuristic");
      }
    }
  }

  // 6. DEFAULT TIME & CUSTOM SELECTORS
  for (const selector of input.selectors) {
    let nodes: NodeListOf<Element>;
    try {
      nodes = document.querySelectorAll(selector);
    } catch {
      continue;
    }
    nodes.forEach((node) => {
      addRegion(node, "manual", selector);
    });
  }

  // 7. AUTO-DISMISS CONSENT: if explicitly enabled, prefer Reject All / Essential Only
  if (config.autoDismissConsent) {
    const rejectButtons = Array.from(document.querySelectorAll("button, a, [role='button']")).filter((btn) => {
      const txt = ((btn as HTMLElement).innerText || btn.textContent || "").toLowerCase().trim();
      return (
        txt === "reject all" ||
        txt === "reject" ||
        txt === "decline" ||
        txt === "essential only" ||
        txt === "only necessary" ||
        txt === "refuse" ||
        txt.includes("reject all") ||
        txt.includes("essential only")
      );
    });

    if (rejectButtons.length > 0) {
      try {
        (rejectButtons[0] as HTMLElement).click();
      } catch {}
    }
  }

  return regions.slice(0, input.maxRegions);
}
