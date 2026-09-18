import { lookup } from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

const BLOCKED_SCHEMES = new Set([
  "file",
  "ftp",
  "gopher",
  "data",
  "javascript",
  "blob",
  "chrome",
  "about",
  "ws",
  "wss",
]);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new UnsafeUrlError("URL is required");
  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (parsed.username || parsed.password) {
    parsed.username = "";
    parsed.password = "";
  }
  parsed.hash = "";
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new UnsafeUrlError("Only HTTP and HTTPS URLs are allowed");
  }
  parsed.hostname = parsed.hostname.replace(/\.$/, "").toLowerCase();
  if (parsed.pathname === "") parsed.pathname = "/";
  return parsed.toString();
}

export function hostnameFromUrl(url: string): string {
  return new URL(url).hostname.toLowerCase();
}

function isBlockedHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  if (hostname.endsWith(".localhost")) return true;
  if (hostname.endsWith(".local")) return true;
  if (hostname.endsWith(".internal")) return true;
  if (hostname.endsWith(".lan")) return true;
  return false;
}

export function isPrivateOrReservedIp(ip: string): boolean {
  if (!net.isIP(ip)) return true;
  try {
    const parsed = ipaddr.parse(ip);
    const range = parsed.range();
    if (
      [
        "loopback",
        "private",
        "linkLocal",
        "uniqueLocal",
        "carrierGradeNat",
        "broadcast",
        "multicast",
        "unspecified",
        "reserved",
        "benchmarking",
        "discard",
        "rfc1918",
        "rfc6598",
      ].includes(range)
    ) {
      return true;
    }
    if (parsed.kind() === "ipv6") {
      const v6 = parsed as ipaddr.IPv6;
      if (v6.isIPv4MappedAddress()) {
        return isPrivateOrReservedIp(v6.toIPv4Address().toString());
      }
    }
    if (ip === "0.0.0.0" || ip === "::" || ip === "::1") return true;
    if (ip.startsWith("169.254.")) return true;
    if (ip.startsWith("100.")) {
      const parts = ip.split(".").map(Number);
      if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function assertSafeUrlShape(input: string): URL {
  const normalized = normalizeHttpUrl(input);
  const url = new URL(normalized);
  const scheme = url.protocol.replace(":", "");
  if (BLOCKED_SCHEMES.has(scheme)) {
    throw new UnsafeUrlError("URL scheme is not allowed");
  }
  if (url.hostname === "") {
    throw new UnsafeUrlError("Hostname is required");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new UnsafeUrlError("Internal hostnames cannot be monitored");
  }
  if (net.isIP(url.hostname) && isPrivateOrReservedIp(url.hostname)) {
    throw new UnsafeUrlError("Private or reserved IP addresses are not allowed");
  }
  return url;
}

export async function resolvePublicAddress(hostname: string): Promise<string[]> {
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new UnsafeUrlError("Private or reserved IP addresses are not allowed");
    }
    return [hostname];
  }
  let records: { address: string; family: number }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("DNS lookup failed");
  }
  if (!records.length) throw new UnsafeUrlError("DNS lookup returned no addresses");
  const addresses = records.map((record) => record.address);
  for (const address of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new UnsafeUrlError("Hostname resolves to a private or reserved address");
    }
  }
  return addresses;
}

export async function assertPublicHttpUrl(input: string): Promise<{
  href: string;
  hostname: string;
  addresses: string[];
}> {
  const url = assertSafeUrlShape(input);
  const addresses = await resolvePublicAddress(url.hostname);
  return { href: url.toString(), hostname: url.hostname, addresses };
}

export function sanitizeUrlForLog(input: string): string {
  try {
    const url = new URL(input);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}
