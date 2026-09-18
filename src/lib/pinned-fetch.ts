import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
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

export class RequestTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

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

export class FetchBudget {
  requests = 0;
  bytes = 0;
  private inflight = 0;
  private waiters: Array<() => void> = [];

  constructor(
    readonly maxRequests: number,
    readonly maxBytes: number,
    readonly maxInflight: number,
  ) {}

  get remainingBytes() {
    return Math.max(0, this.maxBytes - this.bytes);
  }

  assertCanStart() {
    if (this.requests >= this.maxRequests) {
      throw new UnsafeUrlError("Too many outbound requests for this check");
    }
    if (this.remainingBytes <= 0) {
      throw new UnsafeUrlError("Check exceeded total download budget");
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.assertCanStart();
    this.requests += 1;
    while (this.inflight >= this.maxInflight) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.inflight += 1;
    try {
      return await fn();
    } finally {
      this.inflight -= 1;
      this.waiters.shift()?.();
    }
  }

  addBytes(n: number) {
    this.bytes += n;
    if (this.bytes > this.maxBytes) {
      throw new UnsafeUrlError("Check exceeded total download budget");
    }
  }
}

export async function resolvePinnedTarget(input: string) {
  const validated = await assertPublicHttpUrl(input);
  const parsed = new URL(validated.href);
  const ip = validated.addresses[0];
  if (!ip) throw new UnsafeUrlError("DNS lookup returned no addresses");
  if (isPrivateOrReservedIp(ip) && !fixtureEnabled()) {
    throw new UnsafeUrlError("Private or reserved IP addresses are not allowed");
  }
  const port = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === "https:"
      ? 443
      : 80;
  return {
    href: validated.href,
    hostname: parsed.hostname,
    host: parsed.host,
    pathname: `${parsed.pathname}${parsed.search}`,
    protocol: parsed.protocol,
    ip,
    port,
    family: net.isIP(ip) === 6 ? 6 : 4,
  };
}

export async function fetchPinned(
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: Buffer | null;
    timeoutMs?: number;
    maxBytes?: number;
    budget?: FetchBudget;
  },
): Promise<PinnedResponse> {
  const target = await resolvePinnedTarget(input);
  const timeoutMs = init?.timeoutMs ?? 15_000;
  const maxBytes = Math.min(init?.maxBytes ?? 5 * 1024 * 1024, init?.budget?.remainingBytes ?? Infinity);
  if (maxBytes <= 0) throw new UnsafeUrlError("Check exceeded total download budget");
  const method = (init?.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { ...(init?.headers ?? {}) };
  for (const key of Object.keys(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) delete headers[key];
  }
  headers.Host = target.host;
  headers["Accept-Encoding"] = "identity";

  const transport = target.protocol === "https:" ? https : http;
  const execute = () =>
    new Promise<PinnedResponse>((resolve, reject) => {
      const req = transport.request(
        {
          host: target.ip,
          port: target.port,
          method,
          path: target.pathname,
          headers,
          servername: target.hostname,
          family: target.family,
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
            try {
              init?.budget?.addBytes(size);
            } catch (error) {
              reject(error);
              return;
            }
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
        reject(new RequestTimeoutError());
      });
      req.on("error", reject);
      if (init?.body?.length) req.write(init.body);
      req.end();
    });

  if (init?.budget) return init.budget.run(execute);
  return execute();
}

export async function readPinnedTlsExpiry(input: string, timeoutMs = 5000): Promise<Date | null> {
  const target = await resolvePinnedTarget(input);
  if (target.protocol !== "https:") return null;
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: target.ip,
        port: target.port,
        servername: target.hostname,
        timeout: timeoutMs,
      },
      () => {
        const remote = socket.remoteAddress;
        if (remote && isPrivateOrReservedIp(remote) && !fixtureLoopback(remote)) {
          socket.destroy();
          resolve(null);
          return;
        }
        const cert = socket.getPeerCertificate();
        socket.end();
        if (cert?.valid_to) resolve(new Date(cert.valid_to));
        else resolve(null);
      },
    );
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

function fixtureEnabled() {
  return process.env.FIXTURE_ENABLED === "true" || process.env.FIXTURE_ENABLED === "1";
}

function fixtureLoopback(ip: string) {
  return fixtureEnabled() && (ip === "127.0.0.1" || ip === "::1");
}

export function publicHeadersFromRequest(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}
