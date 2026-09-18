export const EXTRACT_DOM_IIFE = `(() => {
  const overflowPx = 8;
  const clip = (value, max = 180) => (value || "").replace(/\\s+/g, " ").trim().slice(0, max);
  const inView = (el) => {
    const rect = el.getBoundingClientRect?.();
    if (!rect) return false;
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  };
  const visible = (el) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect?.();
    return Boolean(rect && rect.width > 1 && rect.height > 1);
  };
  const list = (selector, map, limit = 40) => Array.from(document.querySelectorAll(selector)).slice(0, limit).map(map);
  const bodyText = clip(document.body && document.body.innerText ? document.body.innerText : "", 4000);
  const errorHaystack = (document.title + " " + bodyText).toLowerCase();
  const looksLikeErrorPage = [
    "internal server error",
    "something went wrong",
    "not found",
    "application error",
    "this site can't be reached",
    "this site can't be reached",
    "error 500",
    "error 404",
  ].some((item) => errorHaystack.includes(item));
  const brokenImages = Array.from(document.querySelectorAll("img"))
    .filter((img) => img.complete && img.naturalWidth === 0 && Boolean(img.getAttribute("src")))
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
      text: clip(el.innerText || el.getAttribute("value") || el.getAttribute("aria-label")),
      name: clip(el.getAttribute("name") || el.getAttribute("aria-label")),
      visible: visible(el),
      inViewport: inView(el),
    }),
  );
  const documentWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
  return {
    title: clip(document.title, 250),
    headings: list("h1,h2,h3", (el) => ({ tag: el.tagName, text: clip(el.innerText), visible: visible(el) })),
    links: list("a[href]", (el) => ({ tag: "A", text: clip(el.innerText, 80), href: clip(el.getAttribute("href"), 180) })),
    buttons,
    forms: list("form", (el) => ({
      tag: "FORM",
      name: clip(el.getAttribute("name") || el.getAttribute("id") || el.getAttribute("action")),
    })),
    images: list("img", (el) => ({
      tag: "IMG",
      src: clip(el.getAttribute("src"), 180),
      alt: clip(el.getAttribute("alt")),
      visible: visible(el),
    })),
    textBlocks: list("p, li, [data-cta]", (el) => clip(el.innerText, 240), 30).filter(Boolean),
    landmarkCount: document.querySelectorAll("header, nav, main, footer, form, [role='main']").length,
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
})()`;
