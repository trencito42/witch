import { MONITORING_THRESHOLDS } from "@/lib/constants";
import type { IgnoreRegion } from "./regions";

export const AUTO_IGNORE_SELECTORS = [
  "[id*='cookie' i]",
  "[class*='cookie' i]",
  "[id*='consent' i]",
  "[class*='consent' i]",
  "[id*='onetrust' i]",
  "[class*='intercom' i]",
  "[id*='intercom' i]",
  "[class*='crisp' i]",
  "[id*='hubspot-messages-iframe-container' i]",
  "[class*='chat-widget' i]",
  "iframe[src*='youtube']",
  "iframe[src*='intercom']",
  "video",
  "canvas",
  "time",
  "[datetime]",
  "[class*='clock' i]",
  "[data-live-clock]",
];

export function ignoreRegionCollectorArgs(extraSelectors: string[] = []) {
  return {
    selectors: [...AUTO_IGNORE_SELECTORS, ...extraSelectors],
    maxRatio: MONITORING_THRESHOLDS.maxAutoMaskViewportRatio,
    maxRegions: MONITORING_THRESHOLDS.maxAutoMaskRegions,
  };
}

export function collectIgnoreRegionsInPage(input: {
  selectors: string[];
  maxRatio: number;
  maxRegions: number;
}): IgnoreRegion[] {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const maxArea = viewport.width * viewport.height * input.maxRatio;
  const regions: IgnoreRegion[] = [];
  const seen = new Set<string>();
  for (const selector of input.selectors) {
    let nodes: NodeListOf<Element>;
    try {
      nodes = document.querySelectorAll(selector);
    } catch {
      continue;
    }
    nodes.forEach((node) => {
      const rect = (node as HTMLElement).getBoundingClientRect?.();
      if (!rect || rect.width < 8 || rect.height < 8) return;
      if (rect.bottom < 0 || rect.right < 0 || rect.top > viewport.height || rect.left > viewport.width) {
        return;
      }
      const box = {
        x: Math.max(0, Math.floor(rect.left)),
        y: Math.max(0, Math.floor(rect.top)),
        width: Math.min(viewport.width, Math.ceil(rect.width)),
        height: Math.min(viewport.height, Math.ceil(rect.height)),
        reason: selector.slice(0, 80),
      };
      if (box.width * box.height > maxArea) return;
      const key = `${box.x}:${box.y}:${box.width}:${box.height}`;
      if (seen.has(key)) return;
      seen.add(key);
      regions.push(box);
    });
  }
  return regions.slice(0, input.maxRegions);
}
