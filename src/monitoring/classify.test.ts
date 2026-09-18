import { describe, expect, it } from "vitest";
import { classifyBrowser, classifyHttp } from "./classify";

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
});
