import { describe, expect, it } from "vitest";
import { classifyBrowser, classifyHttp, shouldRecoverAfterSuccesses } from "./classify";

describe("classifyHttp", () => {
  it("treats 500 as critical uptime", () => {
    const issues = classifyHttp({
      success: false,
      statusCode: 500,
      errorCode: "HTTP_ERROR",
      durationMs: 120,
      sslValid: true,
      redirectCount: 0,
    });
    expect(issues[0]?.category).toBe("UPTIME");
    expect(issues[0]?.severity).toBe("CRITICAL");
  });

  it("does not incident a healthy fast response", () => {
    expect(
      classifyHttp({
        success: true,
        statusCode: 200,
        errorCode: null,
        durationMs: 180,
        sslValid: true,
        redirectCount: 1,
      }),
    ).toHaveLength(0);
  });
});

describe("classifyBrowser", () => {
  it("aggregates failed resources", () => {
    const issues = classifyBrowser({
      consoleErrors: [],
      failedRequests: [
        { url: "https://cdn.example/a.js", status: 404 },
        { url: "https://cdn.example/a.js", status: 404 },
        { url: "https://cdn.example/b.js", status: 404 },
        { url: "https://cdn.example/c.js", status: 500 },
      ],
      visualChanged: false,
    });
    expect(issues.find((i) => i.category === "NETWORK")?.title).toContain("3 unique");
  });

  it("does not open a network incident for trackers only", () => {
    const issues = classifyBrowser({
      consoleErrors: [],
      failedRequests: [
        { url: "https://www.google-analytics.com/g/collect", status: 404, kind: "tracker", visibleImpact: false },
        { url: "https://shop.example/favicon.ico", status: 404, kind: "favicon", visibleImpact: false },
      ],
      visualChanged: false,
    });
    expect(issues.find((i) => i.category === "NETWORK")).toBeUndefined();
  });

  it("opens an uptime incident when the browser check times out", () => {
    const issues = classifyBrowser({
      success: false,
      errorCode: "TIMEOUT",
      statusCode: null,
      consoleErrors: [],
      failedRequests: [],
      visualChanged: false,
    });
    expect(issues[0]?.fingerprint).toBe("browser-timeout");
  });

  it("opens an uptime incident when Chromium fails without an error code", () => {
    const issues = classifyBrowser({
      success: false,
      errorCode: null,
      statusCode: null,
      consoleErrors: [],
      failedRequests: [],
      visualChanged: false,
    });
    expect(issues.some((issue) => issue.category === "UPTIME")).toBe(true);
  });

  it("attaches the exact visualDiffId that produced the visual incident", () => {
    const issues = classifyBrowser({
      consoleErrors: [],
      failedRequests: [],
      visualChanged: true,
      differenceRatio: 0.2,
      filteredDifferenceRatio: 0.2,
      visualDiffId: "diff_abc",
    });
    const visual = issues.find((issue) => issue.category === "VISUAL");
    expect(visual?.metadata).toMatchObject({ visualDiffId: "diff_abc" });
  });
});

describe("incident recovery gating", () => {
  it("requires confirmation successes", () => {
    expect(shouldRecoverAfterSuccesses(1, 2)).toBe(false);
    expect(shouldRecoverAfterSuccesses(2, 2)).toBe(true);
  });
});
