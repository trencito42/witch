import http from "node:http";
import https from "node:https";
import net from "node:net";
import {
  assertPublicHttpUrl,
  isPrivateOrReservedIp,
  UnsafeUrlError,
} from "@/lib/safe-url";

export type PinnedResponse = {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  remoteAddress: string | null;
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

export async function fetchPinned(
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: Buffer | null;
    timeoutMs?: number;
    maxBytes?: number;
  },
): Promise<PinnedResponse> {
  const validated = await assertPublicHttpUrl(input);
  const parsed = new URL(validated.href);
  const ip = validated.addresses[0];
  if (!ip) throw new UnsafeUrlError("DNS lookup returned no addresses");
  if (isPrivateOrReservedIp(ip) && process.env.FIXTURE_ENABLED !== "true" && process.env.FIXTURE_ENABLED !== "1") {
    throw new UnsafeUrlError("Private or reserved IP addresses are not allowed");
  }

  const timeoutMs = init?.timeoutMs ?? 15_000;
  const maxBytes = init?.maxBytes ?? 5 * 1024 * 1024;
  const method = (init?.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { ...(init?.headers ?? {}) };
  for (const key of Object.keys(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) delete headers[key];
  }
  headers.Host = parsed.host;
  headers["Accept-Encoding"] = "identity";

  const transport = parsed.protocol === "https:" ? https : http;
  const port = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === "https:"
      ? 443
      : 80;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        host: ip,
        port,
        method,
        path: `${parsed.pathname}${parsed.search}`,
        headers,
        servername: parsed.hostname,
        family: net.isIP(ip) === 6 ? 6 : 4,
        timeout: timeoutMs,
      },
      (res) => {
        const remoteAddress = res.socket.remoteAddress ?? null;
        if (remoteAddress && isPrivateOrReservedIp(remoteAddress) && !fixtureLoopback(remoteAddress)) {
          req.destroy();
          reject(new UnsafeUrlError("Connection resolved to a private address"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy();
            reject(new UnsafeUrlError("Response exceeded size limit"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const outHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
            outHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: outHeaders,
            body: Buffer.concat(chunks),
            remoteAddress,
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.on("error", reject);
    if (init?.body?.length) req.write(init.body);
    req.end();
  });
}

function fixtureLoopback(ip: string) {
  const enabled = process.env.FIXTURE_ENABLED === "true" || process.env.FIXTURE_ENABLED === "1";
  return enabled && (ip === "127.0.0.1" || ip === "::1");
}

export function publicHeadersFromRequest(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (["cookie", "authorization", "proxy-authorization"].includes(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}
