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
      className={cn(
        "-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-1 sm:gap-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar max-w-[100vw] sm:max-w-full snap-x snap-mandatory",
        className,
      )}
    >
      {items.map((tab) => {
        const active = tab.id.toLowerCase() === activeId.toLowerCase();

        const content = (
          <>
            {tab.icon && (
              <span className="hidden sm:inline-flex shrink-0 text-current">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  active
                    ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                    : "bg-[var(--bg-card)] text-[var(--text-faint)]",
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
            )}
          </>
        );

        const classes = cn(
          "relative flex shrink-0 snap-start items-center gap-2 px-3 pb-3 pt-1 text-[14px] md:text-[13px] font-medium whitespace-nowrap transition-colors select-none",
          active
            ? "text-[var(--text)] font-semibold"
            : "text-[var(--text-muted)] hover:text-[var(--text)]",
        );

        if (tab.href) {
          return (
            <Link key={tab.id} href={tab.href} className={classes}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
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
