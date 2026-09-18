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
  consoleErrors: string[];
  failedRequests: { url: string; status: number | null }[];
  visualChanged: boolean;
  differenceRatio?: number;
  missingSelector?: string | null;
  missingText?: string | null;
  domSignificant?: boolean;
  domMissingButtons?: string[];
}): ClassifiedIssue[] {
  const issues: ClassifiedIssue[] = [];
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
    issues.push({
      category: "VISUAL",
      severity: (input.differenceRatio ?? 0) > 0.12 ? "HIGH" : "MEDIUM",
      title: "Visual layout changed",
      summary: `The screenshot differs from the accepted baseline${
        input.differenceRatio != null
          ? ` (${(input.differenceRatio * 100).toFixed(1)}% pixels).`
          : "."
      }`,
      fingerprint: "visual",
      evidence: [
        input.differenceRatio != null
          ? `difference=${input.differenceRatio.toFixed(4)}`
          : "visual-change",
      ],
    });
  }
  if (input.domSignificant) {
    issues.push({
      category: "CONTENT",
      severity: "MEDIUM",
      title: "Page content changed",
      summary: input.domMissingButtons?.length
        ? `Missing controls: ${input.domMissingButtons.slice(0, 3).join(", ")}.`
        : "Structural content is substantially different from the baseline.",
      fingerprint: "content",
      evidence: input.domMissingButtons ?? ["dom-diff"],
    });
  }
  const uniqueFailed = uniqueBy(input.failedRequests, (item) => item.url);
  if (uniqueFailed.length >= 3) {
    issues.push({
      category: "NETWORK",
      severity: uniqueFailed.some((item) => (item.status ?? 0) >= 500)
        ? "HIGH"
        : "MEDIUM",
      title: `${uniqueFailed.length} unique failed resources`,
      summary: "The page requested resources that failed to load.",
      fingerprint: "network",
      evidence: uniqueFailed.slice(0, 12).map((item) => `${item.status ?? "err"} ${item.url}`),
      metadata: { failedRequests: uniqueFailed.slice(0, 40) },
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
