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
  const compactGrid =
    items.length === 4 && items.every((item) => item.label.length <= 8);

  return (
    <div
      className={cn(
        compactGrid
          ? "grid w-full grid-cols-4 gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] md:inline-flex md:w-auto md:grid-cols-none"
          : "inline-flex w-full items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] max-w-full overflow-x-auto no-scrollbar md:w-auto",
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
                "relative inline-flex min-w-0 w-full items-center justify-center gap-1 px-1 py-1.5 text-[12px] font-medium rounded-md transition-all duration-150 select-none md:w-auto md:justify-start md:gap-1.5 md:px-3 md:py-1 md:whitespace-nowrap md:text-[12px]",
                active
                  ? "bg-[var(--bg-hover)] text-[var(--text)] shadow-xs border border-[var(--border-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.03)] border border-transparent",
              )}
            >
              <span className="min-w-0 truncate">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "shrink-0 tabular-nums text-[10px] px-1 py-0.2 rounded-full md:px-1.5",
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
              "relative inline-flex min-w-0 w-full items-center justify-center gap-1 px-1 py-1.5 text-[12px] font-medium rounded-md transition-all duration-150 select-none cursor-pointer md:w-auto md:justify-start md:gap-1.5 md:px-3 md:py-1 md:whitespace-nowrap",
              active
                ? "bg-[var(--bg-hover)] text-[var(--text)] shadow-xs border border-[var(--border-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.03)] border border-transparent",
            )}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "shrink-0 tabular-nums text-[10px] px-1 py-0.2 rounded-full md:px-1.5",
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
