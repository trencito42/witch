import { describe, it, expect } from "vitest";
import { parseUserAgent } from "./user-agent";

describe("parseUserAgent", () => {
  it("handles null or empty", () => {
    expect(parseUserAgent(null).label).toBe("Browser Session");
    expect(parseUserAgent("").label).toBe("Browser Session");
  });

  it("identifies Chrome on Windows", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";
    const res = parseUserAgent(ua);
    expect(res.browser).toBe("Chrome");
    expect(res.os).toBe("Windows");
    expect(res.deviceType).toBe("desktop");
    expect(res.label).toBe("Chrome on Windows");
  });

  it("identifies Safari on iPhone", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1";
    const res = parseUserAgent(ua);
    expect(res.browser).toBe("Safari");
    expect(res.os).toBe("iOS");
    expect(res.deviceType).toBe("mobile");
  });

  it("identifies Firefox on Linux", () => {
    const ua = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
    const res = parseUserAgent(ua);
    expect(res.browser).toBe("Firefox");
    expect(res.os).toBe("Linux");
    expect(res.deviceType).toBe("desktop");
  });
});
