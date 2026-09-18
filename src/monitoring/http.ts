import { getEnv } from "@/lib/env";
import {
  assertPublicHttpUrl,
  assertSafeUrlShape,
  sanitizeUrlForLog,
  UnsafeUrlError,
} from "@/lib/safe-url";
import { fetchPinned, readPinnedTlsExpiry, RequestTimeoutError, type PinnedResponse } from "@/lib/pinned-fetch";

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
        sslExpiresAt = await readPinnedTlsExpiry(validated.href);
        sslValid = sslExpiresAt ? sslExpiresAt.getTime() > Date.now() : true;
      } else {
        sslValid = null;
      }

      let response: PinnedResponse;
      try {
        response = await fetchPinned(validated.href, {
          method: "GET",
          timeoutMs: env.HTTP_CHECK_TIMEOUT_MS,
          headers: {
            "User-Agent": "WitchMonitor/1.0 (+https://witch.pw)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
      } catch (error) {
        if (error instanceof RequestTimeoutError) throw error;
        throw error;
      }

      statusCode = response.status;
      for (const [key, value] of Object.entries(response.headers)) {
        if (["content-type", "cache-control", "server", "location"].includes(key.toLowerCase())) {
          headers[key.toLowerCase()] = value.slice(0, 300);
        }
      }

      const location = response.headers.location ?? response.headers.Location;
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
    if (
      error instanceof RequestTimeoutError ||
      (error instanceof Error && error.name === "AbortError") ||
      message.toLowerCase().includes("timed out")
    ) {
      errorCode = "TIMEOUT";
    }
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
