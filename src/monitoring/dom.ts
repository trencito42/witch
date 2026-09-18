import { MONITORING_THRESHOLDS } from "@/lib/constants";

export type DomNodeSignal = {
  tag: string;
  text?: string;
  name?: string;
  href?: string;
  src?: string;
  alt?: string;
  visible?: boolean;
  inViewport?: boolean;
  selectorHint?: string;
};

export type DomSignals = {
  title: string;
  headings: DomNodeSignal[];
  links: DomNodeSignal[];
  buttons: DomNodeSignal[];
  forms: DomNodeSignal[];
  images: DomNodeSignal[];
  textBlocks: string[];
  landmarkCount: number;
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  horizontalOverflow: boolean;
  bodyTextLength: number;
  looksLikeErrorPage: boolean;
  brokenImages: string[];
  formsMissingSubmit: number;
  offscreenButtons: string[];
};

export type DomDiff = {
  missingHeadings: string[];
  missingButtons: string[];
  missingForms: number;
  missingImages: string[];
  missingLinks: string[];
  textReductionRatio: number;
  landmarkReduction: number;
  horizontalOverflow: boolean;
  looksLikeErrorPage: boolean;
  brokenImages: string[];
  formsMissingSubmit: number;
  emptyBody: boolean;
  offscreenButtons: string[];
  significant: boolean;
};

function keyOf(node: DomNodeSignal) {
  return (node.text || node.name || node.href || node.src || node.alt || node.tag)
    .toLowerCase()
    .trim()
    .slice(0, 180);
}

function missing(previous: DomNodeSignal[], current: DomNodeSignal[]) {
  const currentKeys = new Set(current.map(keyOf));
  return previous
    .map(keyOf)
    .filter((item) => item && !currentKeys.has(item));
}

export function diffDomSignals(baseline: DomSignals, current: DomSignals): DomDiff {
  const missingHeadings = missing(baseline.headings, current.headings);
  const missingButtons = missing(baseline.buttons, current.buttons);
  const missingImages = missing(baseline.images, current.images).filter(Boolean);
  const missingLinks = missing(baseline.links, current.links);
  const baselineText = baseline.textBlocks.join(" ").length || 1;
  const currentText = current.textBlocks.join(" ").length;
  const textReductionRatio = Math.max(0, (baselineText - currentText) / baselineText);
  const missingForms = Math.max(0, baseline.forms.length - current.forms.length);
  const landmarkReduction = Math.max(0, baseline.landmarkCount - current.landmarkCount);
  const emptyBody = (current.bodyTextLength ?? currentText) < 40 && baselineText > 120;
  const horizontalOverflow = Boolean(current.horizontalOverflow);
  const looksLikeErrorPage = Boolean(current.looksLikeErrorPage && !baseline.looksLikeErrorPage);
  const brokenImages = current.brokenImages ?? [];
  const formsMissingSubmit = current.formsMissingSubmit ?? 0;
  const offscreenButtons = (current.offscreenButtons ?? []).filter((name) =>
    baseline.buttons.some((button) => keyOf(button) === name),
  );
  const significant =
    missingButtons.length > 0 ||
    missingForms > 0 ||
    missingHeadings.length >= 2 ||
    missingImages.length >= 2 ||
    textReductionRatio >= MONITORING_THRESHOLDS.textReductionSignificant ||
    landmarkReduction >= 4 ||
    emptyBody ||
    looksLikeErrorPage ||
    brokenImages.length > 0 ||
    formsMissingSubmit > 0 ||
    (horizontalOverflow && (baseline.viewportWidth ?? 0) <= 430) ||
    offscreenButtons.length > 0;
  return {
    missingHeadings: missingHeadings.slice(0, 12),
    missingButtons: missingButtons.slice(0, 12),
    missingForms,
    missingImages: missingImages.slice(0, 12),
    missingLinks: missingLinks.slice(0, 12),
    textReductionRatio,
    landmarkReduction,
    horizontalOverflow,
    looksLikeErrorPage,
    brokenImages: brokenImages.slice(0, 12),
    formsMissingSubmit,
    emptyBody,
    offscreenButtons: offscreenButtons.slice(0, 8),
    significant,
  };
}

export function extractDomSignals(): DomSignals {
  const overflowPx = 8;
  const clip = (value: string | null | undefined, max = 180) =>
    (value || "").replace(/\s+/g, " ").trim().slice(0, max);
  const inView = (el: Element) => {
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    if (!rect) return false;
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  };
  const visible = (el: Element) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    return Boolean(rect && rect.width > 1 && rect.height > 1);
  };
  const list = (
    selector: string,
    map: (el: Element) => DomNodeSignal | string,
    limit = 40,
  ) => Array.from(document.querySelectorAll(selector)).slice(0, limit).map(map);
  const bodyText = clip(document.body?.innerText ?? "", 4000);
  const errorHaystack = `${document.title} ${bodyText}`.toLowerCase();
  const looksLikeErrorPage = [
    "internal server error",
    "something went wrong",
    "not found",
    "application error",
    "this site can’t be reached",
    "this site can't be reached",
    "error 500",
    "error 404",
  ].some((item) => errorHaystack.includes(item));
  const brokenImages = Array.from(document.querySelectorAll("img"))
    .filter((img) => {
      const image = img as HTMLImageElement;
      return image.complete && image.naturalWidth === 0 && Boolean(image.getAttribute("src"));
    })
    .map((img) => clip(img.getAttribute("alt") || img.getAttribute("src"), 80))
    .filter(Boolean)
    .slice(0, 12);
  const formsMissingSubmit = Array.from(document.querySelectorAll("form")).filter((form) => {
    return !form.querySelector("button, input[type='submit'], input[type='button'], [type='image']");
  }).length;
  const buttons = list(
    "button, [role='button'], input[type='submit'], input[type='button']",
    (el) => ({
      tag: el.tagName,
      text: clip(
        (el as HTMLElement).innerText ||
          el.getAttribute("value") ||
          el.getAttribute("aria-label"),
      ),
      name: clip(el.getAttribute("name") || el.getAttribute("aria-label")),
      visible: visible(el),
      inViewport: inView(el),
    }),
  ) as DomNodeSignal[];
  const documentWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body?.scrollWidth ?? 0,
  );
  return {
    title: clip(document.title, 250),
    headings: list("h1,h2,h3", (el) => ({
      tag: el.tagName,
      text: clip((el as HTMLElement).innerText),
      visible: visible(el),
    })) as DomNodeSignal[],
    links: list("a[href]", (el) => ({
      tag: "A",
      text: clip((el as HTMLElement).innerText, 80),
      href: clip(el.getAttribute("href"), 180),
    })) as DomNodeSignal[],
    buttons,
    forms: list("form", (el) => ({
      tag: "FORM",
      name: clip(
        el.getAttribute("name") || el.getAttribute("id") || el.getAttribute("action"),
      ),
    })) as DomNodeSignal[],
    images: list("img", (el) => ({
      tag: "IMG",
      src: clip(el.getAttribute("src"), 180),
      alt: clip(el.getAttribute("alt")),
      visible: visible(el),
    })) as DomNodeSignal[],
    textBlocks: list("p, li, [data-cta]", (el) => clip((el as HTMLElement).innerText, 240), 30).filter(
      Boolean,
    ) as string[],
    landmarkCount: document.querySelectorAll(
      "header, nav, main, footer, form, [role='main']",
    ).length,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth,
    horizontalOverflow: documentWidth > window.innerWidth + overflowPx,
    bodyTextLength: bodyText.length,
    looksLikeErrorPage,
    brokenImages,
    formsMissingSubmit,
    offscreenButtons: buttons
      .filter((button) => button.visible && button.inViewport === false && button.text)
      .map((button) => (button.text || "").toLowerCase())
      .slice(0, 8),
  };
}
