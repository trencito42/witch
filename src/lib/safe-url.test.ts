import { describe, expect, it } from "vitest";
import {
  assertSafeUrlShape,
  isPrivateOrReservedIp,
  normalizeHttpUrl,
  sanitizeEvidence,
  UnsafeUrlError,
} from "./safe-url";

describe("normalizeHttpUrl", () => {
  it("adds https when missing", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com/");
  });

  it("lowercases host and strips hash", () => {
    expect(normalizeHttpUrl("https://Example.COM/path#x")).toBe(
      "https://example.com/path",
    );
  });

  it("rejects file urls", () => {
    expect(() => normalizeHttpUrl("file:///etc/passwd")).toThrow(UnsafeUrlError);
  });
});

describe("assertSafeUrlShape", () => {
  it("rejects localhost", () => {
    expect(() => assertSafeUrlShape("http://localhost")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("http://127.0.0.1")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("http://0.0.0.0")).toThrow(UnsafeUrlError);
  });

  it("rejects metadata and private ranges", () => {
    expect(() => assertSafeUrlShape("http://169.254.169.254")).toThrow(
      UnsafeUrlError,
    );
    expect(() => assertSafeUrlShape("http://10.0.0.5")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("http://192.168.1.10")).toThrow(
      UnsafeUrlError,
    );
    expect(() => assertSafeUrlShape("http://172.16.0.8")).toThrow(UnsafeUrlError);
  });

  it("rejects ftp and file", () => {
    expect(() => assertSafeUrlShape("ftp://example.com")).toThrow(UnsafeUrlError);
  });

  it("rejects encoded loopback hosts", () => {
    expect(() => assertSafeUrlShape("http://2130706433")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("http://0x7f000001")).toThrow(UnsafeUrlError);
  });

  it("allows public https hosts", () => {
    expect(assertSafeUrlShape("https://example.com/app").hostname).toBe(
      "example.com",
    );
  });
});

describe("isPrivateOrReservedIp", () => {
  it("flags loopback and private", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.1.2.3")).toBe(true);
    expect(isPrivateOrReservedIp("172.20.10.2")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
  });

  it("allows public unicast", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
  });
});

describe("sanitizeEvidence", () => {
  it("redacts secrets", () => {
    expect(sanitizeEvidence("Authorization: Bearer abc.def")).toContain("[redacted]");
    expect(sanitizeEvidence("token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb")).toContain("[redacted-jwt]");
  });
});
