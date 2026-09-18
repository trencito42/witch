"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import Link from "next/link";

export interface SegmentItem {
  id: string;
  label: string;
  count?: number;
  href?: string;
}

export function SegmentedControl({
  items,
  value,
  onChange,
  className,
}: {
  items: SegmentItem[];
  value: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] max-w-full overflow-x-auto no-scrollbar",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id.toLowerCase() === value.toLowerCase();

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md whitespace-nowrap transition-all duration-150 select-none",
                active
                  ? "bg-[var(--bg-hover)] text-[var(--text)] shadow-xs border border-[var(--border-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.03)] border border-transparent",
              )}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    active
                      ? "bg-[var(--bg-active)] text-[var(--text)]"
                      : "bg-[var(--bg-card)] text-[var(--text-faint)]",
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md whitespace-nowrap transition-all duration-150 select-none cursor-pointer",
              active
                ? "bg-[var(--bg-hover)] text-[var(--text)] shadow-xs border border-[var(--border-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.03)] border border-transparent",
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  active
                    ? "bg-[var(--bg-active)] text-[var(--text)]"
                    : "bg-[var(--bg-card)] text-[var(--text-faint)]",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
