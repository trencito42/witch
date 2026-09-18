export type DomNodeSignal = {
  tag: string;
  text?: string;
  name?: string;
  href?: string;
  src?: string;
  alt?: string;
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
};

export type DomDiff = {
  missingHeadings: string[];
  missingButtons: string[];
  missingForms: number;
  missingImages: string[];
  missingLinks: string[];
  textReductionRatio: number;
  landmarkReduction: number;
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
  const significant =
    missingButtons.length > 0 ||
    missingForms > 0 ||
    missingHeadings.length >= 2 ||
    missingImages.length >= 2 ||
    textReductionRatio >= 0.45 ||
    landmarkReduction >= 4;
  return {
    missingHeadings: missingHeadings.slice(0, 12),
    missingButtons: missingButtons.slice(0, 12),
    missingForms,
    missingImages: missingImages.slice(0, 12),
    missingLinks: missingLinks.slice(0, 12),
    textReductionRatio,
    landmarkReduction,
    significant,
  };
}

export function extractDomSignals(): DomSignals {
  const clip = (value: string | null | undefined, max = 180) =>
    (value || "").replace(/\s+/g, " ").trim().slice(0, max);
  const list = (
    selector: string,
    map: (el: Element) => DomNodeSignal | string,
    limit = 40,
  ) => Array.from(document.querySelectorAll(selector)).slice(0, limit).map(map);
  return {
    title: clip(document.title, 250),
    headings: list("h1,h2,h3", (el) => ({
      tag: el.tagName,
      text: clip((el as HTMLElement).innerText),
    })) as DomNodeSignal[],
    links: list("a[href]", (el) => ({
      tag: "A",
      text: clip((el as HTMLElement).innerText, 80),
      href: clip(el.getAttribute("href"), 180),
    })) as DomNodeSignal[],
    buttons: list(
      "button, [role='button'], input[type='submit'], input[type='button']",
      (el) => ({
        tag: el.tagName,
        text: clip(
          (el as HTMLElement).innerText ||
            el.getAttribute("value") ||
            el.getAttribute("aria-label"),
        ),
        name: clip(el.getAttribute("name") || el.getAttribute("aria-label")),
      }),
    ) as DomNodeSignal[],
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
    })) as DomNodeSignal[],
    textBlocks: list("p, li, [data-cta]", (el) => clip((el as HTMLElement).innerText, 240), 30).filter(
      Boolean,
    ) as string[],
    landmarkCount: document.querySelectorAll(
      "header, nav, main, footer, form, [role='main']",
    ).length,
  };
}
