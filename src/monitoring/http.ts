import tls from "node:tls";
import { getEnv } from "@/lib/env";
import {
  assertPublicHttpUrl,
  assertSafeUrlShape,
  sanitizeUrlForLog,
  UnsafeUrlError,
} from "@/lib/safe-url";

export type HttpCheckResult = {
  success: boolean;
  statusCode: number | null;
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
  errorCode: string | null;
  errorMessage: string | null;
  resolvedIp: string | null;
  finalUrl: string | null;
  redirectChain: string[];
  sslValid: boolean | null;
  sslExpiresAt: Date | null;
  headers: Record<string, string>;
};

async function readTlsExpiry(hostname: string, port: number): Promise<Date | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        timeout: 5000,
      },
      () => {
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

export async function runHttpCheck(targetUrl: string): Promise<HttpCheckResult> {
  const startedAt = new Date();
  const env = getEnv();
  const redirectChain: string[] = [];
  const headers: Record<string, string> = {};

  try {
    let current = (await assertPublicHttpUrl(targetUrl)).href;
    let finalUrl = current;
    let statusCode: number | null = null;
    let resolvedIp: string | null = null;
    let sslValid: boolean | null = null;
    let sslExpiresAt: Date | null = null;

    for (let i = 0; i <= env.MAX_REDIRECTS; i += 1) {
      const validated = await assertPublicHttpUrl(current);
      resolvedIp = validated.addresses[0] ?? null;
      const parsed = new URL(validated.href);
      if (parsed.protocol === "https:") {
        sslExpiresAt = await readTlsExpiry(parsed.hostname, parsed.port ? Number(parsed.port) : 443);
        sslValid = sslExpiresAt ? sslExpiresAt.getTime() > Date.now() : true;
      } else {
        sslValid = null;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.HTTP_CHECK_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(validated.href, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "WitchMonitor/1.0 (+https://witch.pw)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
      } finally {
        clearTimeout(timeout);
      }

      statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (["content-type", "cache-control", "server", "location"].includes(key)) {
          headers[key] = value.slice(0, 300);
        }
      });

      const location = response.headers.get("location");
      if (statusCode >= 300 && statusCode < 400 && location) {
        redirectChain.push(sanitizeUrlForLog(validated.href));
        const next = new URL(location, validated.href).toString();
        assertSafeUrlShape(next);
        current = next;
        continue;
      }

      finalUrl = validated.href;
      const completedAt = new Date();
      const success = statusCode >= 200 && statusCode < 400;
      return {
        success,
        statusCode,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        startedAt,
        completedAt,
        errorCode: success ? null : "HTTP_ERROR",
        errorMessage: success ? null : `HTTP ${statusCode}`,
        resolvedIp,
        finalUrl,
        redirectChain,
        sslValid,
        sslExpiresAt,
        headers,
      };
    }

    throw new UnsafeUrlError("Too many redirects");
  } catch (error) {
    const completedAt = new Date();
    const message = error instanceof Error ? error.message : "HTTP check failed";
    let errorCode = "HTTP_FAILURE";
    if (error instanceof UnsafeUrlError) errorCode = "UNSAFE_URL";
    if (error instanceof Error && error.name === "AbortError") errorCode = "TIMEOUT";
    if (message.toLowerCase().includes("certificate") || message.toLowerCase().includes("ssl")) {
      errorCode = "SSL_ERROR";
    }
    if (message.toLowerCase().includes("dns") || message.toLowerCase().includes("lookup")) {
      errorCode = "DNS_FAILURE";
    }
    return {
      success: false,
      statusCode: null,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
      errorCode,
      errorMessage: message.slice(0, 500),
      resolvedIp: null,
      finalUrl: null,
      redirectChain,
      sslValid: errorCode === "SSL_ERROR" ? false : null,
      sslExpiresAt: null,
      headers,
    };
  }
}
