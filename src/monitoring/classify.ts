export type IncidentCategory =
  | "UPTIME"
  | "SSL"
  | "PERFORMANCE"
  | "VISUAL"
  | "ELEMENT"
  | "CONTENT"
  | "JAVASCRIPT"
  | "NETWORK"
  | "REDIRECT"
  | "UNKNOWN";

export type IncidentSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ClassifiedIssue = {
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  summary: string;
  fingerprint: string;
  evidence: string[];
  metadata?: Record<string, unknown>;
};

export function classifyHttp(input: {
  success: boolean;
  statusCode: number | null;
  errorCode: string | null;
  durationMs: number;
  sslValid: boolean | null;
  redirectCount: number;
}): ClassifiedIssue[] {
  const issues: ClassifiedIssue[] = [];
  if (input.errorCode === "SSL_ERROR" || input.sslValid === false) {
    issues.push({
      category: "SSL",
      severity: "HIGH",
      title: "TLS certificate problem",
      summary: "The HTTPS connection failed certificate validation.",
      fingerprint: "ssl",
      evidence: [input.errorCode ?? "ssl_invalid"],
    });
  }
  if (!input.success && input.errorCode === "TIMEOUT") {
    issues.push({
      category: "PERFORMANCE",
      severity: "HIGH",
      title: "HTTP check timed out",
      summary: "The site did not respond within the configured timeout.",
      fingerprint: "http-timeout",
      evidence: [`durationMs=${input.durationMs}`],
    });
  } else if (!input.success) {
    issues.push({
      category: "UPTIME",
      severity: input.statusCode && input.statusCode >= 500 ? "CRITICAL" : "HIGH",
      title: input.statusCode ? `HTTP ${input.statusCode}` : "Site unreachable",
      summary: input.statusCode
        ? `The origin returned HTTP ${input.statusCode}.`
        : "The HTTP check could not complete.",
      fingerprint: `uptime:${input.statusCode ?? input.errorCode ?? "down"}`,
      evidence: [input.errorCode ?? "http_failure"],
    });
  }
  if (input.redirectCount >= 5) {
    issues.push({
      category: "REDIRECT",
      severity: "MEDIUM",
      title: "Redirect chain is too long",
      summary: `The request followed ${input.redirectCount} redirects.`,
      fingerprint: "redirect-loop",
      evidence: [`redirects=${input.redirectCount}`],
    });
  }
  if (input.success && input.durationMs >= 4000) {
    issues.push({
      category: "PERFORMANCE",
      severity: "LOW",
      title: "Slow HTTP response",
      summary: `The response took ${(input.durationMs / 1000).toFixed(1)}s.`,
      fingerprint: "slow-http",
      evidence: [`durationMs=${input.durationMs}`],
    });
  }
  return issues;
}

export function classifyBrowser(input: {
  success?: boolean;
  errorCode?: string | null;
  statusCode?: number | null;
  consoleErrors: string[];
  failedRequests: { url: string; status: number | null; kind?: string; visibleImpact?: boolean }[];
  visualChanged: boolean;
  differenceRatio?: number;
  filteredDifferenceRatio?: number;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
  missingSelector?: string | null;
  missingText?: string | null;
  domSignificant?: boolean;
  domMissingButtons?: string[];
  horizontalOverflow?: boolean;
  looksLikeErrorPage?: boolean;
  brokenImages?: string[];
  emptyBody?: boolean;
  formsMissingSubmit?: number;
}): ClassifiedIssue[] {
  const issues: ClassifiedIssue[] = [];
  if (input.success === false) {
    if (input.errorCode === "TIMEOUT") {
      issues.push({
        category: "PERFORMANCE",
        severity: "HIGH",
        title: "Browser check timed out",
        summary: "Chromium did not finish loading the page within the timeout.",
        fingerprint: "browser-timeout",
        evidence: [input.errorCode],
      });
    } else if (input.errorCode === "SCREENSHOT_LIMIT") {
      // Storage pressure is not a site outage.
    } else {
      issues.push({
        category: "UPTIME",
        severity: input.statusCode && input.statusCode >= 500 ? "CRITICAL" : "HIGH",
        title: input.statusCode ? `Browser HTTP ${input.statusCode}` : "Browser check failed",
        summary:
          input.errorCode === "UNSAFE_URL"
            ? "The URL was blocked by the SSRF policy."
            : "The browser check could not complete.",
        fingerprint: `browser:${input.statusCode ?? input.errorCode ?? "failed"}`,
        evidence: [input.errorCode ?? "browser_failure"],
      });
    }
  }
  if (input.missingSelector || input.missingText) {
    issues.push({
      category: "ELEMENT",
      severity: "HIGH",
      title: "Expected element is missing",
      summary: input.missingSelector
        ? `Selector ${input.missingSelector} was not found or did not match.`
        : `Expected text was not found.`,
      fingerprint: `element:${input.missingSelector ?? input.missingText}`,
      evidence: [input.missingSelector ?? input.missingText ?? "missing"],
    });
  }
  if (input.visualChanged) {
    const ratio = input.filteredDifferenceRatio ?? input.differenceRatio ?? 0;
    issues.push({
      category: "VISUAL",
      severity: ratio > 0.12 ? "HIGH" : "MEDIUM",
      title: "Visual layout changed",
      summary: `The screenshot differs from the accepted baseline (${(ratio * 100).toFixed(1)}% filtered pixels).`,
      fingerprint: "visual",
      evidence: [
        `difference=${(input.differenceRatio ?? 0).toFixed(4)}`,
        `filtered=${ratio.toFixed(4)}`,
        input.boundingBox
          ? `box=${input.boundingBox.x},${input.boundingBox.y},${input.boundingBox.width}x${input.boundingBox.height}`
          : "visual-change",
      ],
      metadata: {
        boundingBox: input.boundingBox ?? null,
        differenceRatio: input.differenceRatio,
        filteredDifferenceRatio: input.filteredDifferenceRatio,
      },
    });
  }
  if (input.domSignificant || input.looksLikeErrorPage || input.emptyBody || (input.brokenImages?.length ?? 0) > 0) {
    const details = [
      ...(input.domMissingButtons ?? []),
      ...(input.brokenImages ?? []).map((item) => `broken-image:${item}`),
      input.horizontalOverflow ? "mobile-overflow" : "",
      input.looksLikeErrorPage ? "error-page-body" : "",
      input.emptyBody ? "empty-body" : "",
      input.formsMissingSubmit ? "form-missing-submit" : "",
    ].filter(Boolean);
    issues.push({
      category: "CONTENT",
      severity: input.looksLikeErrorPage || input.emptyBody ? "HIGH" : "MEDIUM",
      title: input.horizontalOverflow
        ? "Mobile layout overflow"
        : input.domMissingButtons?.length
          ? "Page content changed"
          : "Page structure changed",
      summary: input.domMissingButtons?.length
        ? `Missing controls: ${input.domMissingButtons.slice(0, 3).join(", ")}.`
        : input.horizontalOverflow
          ? "The page is wider than the mobile viewport."
          : "Structural content is substantially different from the baseline.",
      fingerprint: input.horizontalOverflow ? "mobile-overflow" : "content",
      evidence: details.length ? details : ["dom-diff"],
    });
  }
  const impactful = uniqueBy(
    input.failedRequests.filter(
      (item) => item.visibleImpact !== false && item.kind !== "tracker" && item.kind !== "favicon",
    ),
    (item) => item.url,
  );
  const serious = impactful.filter((item) =>
    ["stylesheet", "script", "image", "document"].includes(item.kind ?? ""),
  );
  if (serious.length >= 1 || impactful.length >= 3) {
    issues.push({
      category: "NETWORK",
      severity: impactful.some((item) => (item.status ?? 0) >= 500 || item.kind === "stylesheet" || item.kind === "script")
        ? "HIGH"
        : "MEDIUM",
      title:
        impactful.length === 1
          ? "Visible asset failed to load"
          : `${impactful.length} unique failed resources`,
      summary: "The page requested first-party or visible assets that failed to load.",
      fingerprint: "network",
      evidence: impactful.slice(0, 12).map((item) => `${item.status ?? "err"} ${item.kind ?? "asset"} ${item.url}`),
      metadata: { failedRequests: impactful.slice(0, 40) },
    });
  }
  const uniqueJs = uniqueBy(
    input.consoleErrors.map((message) => ({ message })),
    (item) => item.message,
  );
  if (uniqueJs.length >= 1) {
    issues.push({
      category: "JAVASCRIPT",
      severity: uniqueJs.length >= 5 ? "MEDIUM" : "LOW",
      title:
        uniqueJs.length === 1
          ? "JavaScript error"
          : `${uniqueJs.length} unique JavaScript errors`,
      summary: "The browser reported page script errors during the check.",
      fingerprint: "javascript",
      evidence: uniqueJs.slice(0, 8).map((item) => item.message),
    });
  }
  return issues;
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const id = key(item).slice(0, 300);
    if (seen.has(id)) continue;
    seen.add(id);
    output.push(item);
  }
  return output;
}

export function shouldCreateUptimeIssue(confirmUptime: boolean) {
  return confirmUptime;
}

export function shouldRecoverAfterSuccesses(consecutiveSuccesses: number, required: number) {
  return consecutiveSuccesses >= required;
}

export function incidentFingerprint(monitorId: string, issueFingerprint: string) {
  return `${monitorId}:${issueFingerprint}`;
}
