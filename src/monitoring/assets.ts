import { sanitizeUrlForLog } from "@/lib/safe-url";

const TRACKER_HINTS = [
  "google-analytics",
  "googletagmanager",
  "gtag/",
  "doubleclick",
  "facebook.com/tr",
  "connect.facebook",
  "hotjar",
  "segment.com",
  "mixpanel",
  "amplitude",
  "fullstory",
  "sentry.io",
  "newrelic",
  "clarity.ms",
  "adsystem",
  "adservice",
  "pixel",
];

export type FailedResource = {
  url: string;
  status: number | null;
  method?: string;
  resourceType?: string;
};

export type ClassifiedResource = FailedResource & {
  kind: "document" | "stylesheet" | "script" | "image" | "font" | "favicon" | "tracker" | "other";
  firstParty: boolean;
  visibleImpact: boolean;
};

export function classifyFailedResource(
  item: FailedResource,
  pageHost: string,
): ClassifiedResource {
  let parsedPath = "";
  let host = "";
  try {
    const url = new URL(item.url);
    parsedPath = url.pathname.toLowerCase();
    host = url.hostname.toLowerCase();
  } catch {
    parsedPath = item.url.toLowerCase();
  }
  const firstParty = Boolean(pageHost) && (host === pageHost || host.endsWith(`.${pageHost}`));
  const haystack = `${host}${parsedPath}`;
  const isTracker = TRACKER_HINTS.some((hint) => haystack.includes(hint));
  const isFavicon = parsedPath.includes("favicon") || parsedPath.endsWith(".ico");
  let kind: ClassifiedResource["kind"] = "other";
  if (isTracker) kind = "tracker";
  else if (isFavicon) kind = "favicon";
  else if (item.resourceType === "stylesheet" || parsedPath.endsWith(".css")) kind = "stylesheet";
  else if (item.resourceType === "script" || parsedPath.endsWith(".js") || parsedPath.endsWith(".mjs")) {
    kind = "script";
  } else if (item.resourceType === "image" || /\.(png|jpe?g|webp|gif|svg|avif)$/.test(parsedPath)) {
    kind = "image";
  } else if (item.resourceType === "font" || /\.(woff2?|ttf|otf)$/.test(parsedPath)) kind = "font";
  else if (item.resourceType === "document") kind = "document";

  const visibleImpact =
    !isTracker &&
    !isFavicon &&
    (kind === "stylesheet" || kind === "script" || kind === "image" || kind === "document");

  return {
    ...item,
    url: sanitizeUrlForLog(item.url),
    kind,
    firstParty,
    visibleImpact,
  };
}

export function meaningfulFailedResources(items: FailedResource[], pageHost: string) {
  return items
    .map((item) => classifyFailedResource(item, pageHost))
    .filter((item) => item.visibleImpact);
}
