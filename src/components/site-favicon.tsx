"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function SiteFavicon({
  faviconUrl,
  url,
  name,
  size = 20,
  className,
}: {
  faviconUrl?: string | null;
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [error, setError] = React.useState(false);

  const initial = (name || url || "W").replace(/^https?:\/\//i, "").trim().charAt(0).toUpperCase();

  // If the stored URL is the blurry Google s2 fallback, discard it in favor of direct /favicon.ico or initial
  let effectiveSrc = faviconUrl;
  if (effectiveSrc && effectiveSrc.includes("google.com/s2/favicons")) {
    if (url) {
      try {
        effectiveSrc = new URL("/favicon.ico", url).toString();
      } catch {
        effectiveSrc = null;
      }
    } else {
      effectiveSrc = null;
    }
  }

  if (error || !effectiveSrc) {
    return (
      <div
        style={{
          width: size,
          height: size,
          fontSize: Math.max(9, Math.floor(size * 0.55)),
        }}
        className={cn(
          "rounded-md bg-[var(--surface-overlay)] border border-[var(--border)] flex items-center justify-center font-semibold text-[var(--text-muted)] shrink-0 select-none",
          className
        )}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveSrc}
      alt=""
      width={size}
      height={size}
      onError={() => setError(true)}
      className={cn("rounded-xs shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
