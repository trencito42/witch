"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  href?: string;
  icon?: React.ReactNode;
}

export function Tabs({
  items,
  activeId,
  onChange,
  className,
}: {
  items: TabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar max-w-[100vw] sm:max-w-full snap-x snap-mandatory scroll-smooth",
        className,
      )}
    >
      {items.map((tab) => {
        const active = tab.id.toLowerCase() === activeId.toLowerCase();

        const content = (
          <>
            {tab.icon && (
              <span className="shrink-0 text-current" aria-hidden>{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums",
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]",
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
              />
            )}
          </>
        );

        const classes = cn(
          "relative flex shrink-0 snap-start items-center gap-2 px-3.5 py-3 text-[14px] font-medium whitespace-nowrap transition-colors select-none touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-t-lg",
          active
            ? "text-[var(--text)] font-semibold"
            : "text-[var(--text-muted)] hover:text-[var(--text)]",
        );

        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={classes}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
