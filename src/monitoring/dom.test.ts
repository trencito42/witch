import { describe, expect, it } from "vitest";
import { diffDomSignals, type DomSignals } from "./dom";
import { visualThresholdLogic } from "./visual";

const empty = (): DomSignals => ({
  title: "Home",
  headings: [{ tag: "H1", text: "Store" }],
  links: [],
  buttons: [{ tag: "BUTTON", text: "Checkout" }],
  forms: [{ tag: "FORM", name: "cart" }],
  images: [{ tag: "IMG", src: "/hero.png", alt: "Hero" }],
  textBlocks: ["Welcome to the store"],
  landmarkCount: 4,
  viewportWidth: 390,
  viewportHeight: 844,
  documentWidth: 390,
  horizontalOverflow: false,
  bodyTextLength: 40,
  looksLikeErrorPage: false,
  brokenImages: [],
  formsMissingSubmit: 0,
  offscreenButtons: [],
});

describe("dom diff", () => {
  it("flags missing CTA and form", () => {
    const current = empty();
    current.buttons = [];
    current.forms = [];
    const diff = diffDomSignals(empty(), current);
    expect(diff.significant).toBe(true);
    expect(diff.missingButtons).toContain("checkout");
    expect(diff.missingForms).toBe(1);
  });

  it("flags mobile overflow against a mobile baseline", () => {
    const current = empty();
    current.horizontalOverflow = true;
    current.documentWidth = 1200;
    expect(diffDomSignals(empty(), current).significant).toBe(true);
    expect(diffDomSignals(empty(), current).horizontalOverflow).toBe(true);
  });
});

describe("visual threshold", () => {
  it("ignores anti-aliasing scale changes", () => {
    expect(visualThresholdLogic(0.004, "MEDIUM")).toBe(false);
    expect(visualThresholdLogic(0.05, "MEDIUM")).toBe(true);
    expect(visualThresholdLogic(0.05, "LOW")).toBe(false);
  });
});
