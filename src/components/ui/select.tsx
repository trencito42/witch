"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center w-full">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-md border bg-[var(--bg-elevated)] pl-3 pr-8 text-[var(--text)] transition-all duration-150 cursor-pointer",
            "hover:border-[var(--border-strong)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] focus-visible:bg-[var(--bg-card)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error
              ? "border-[var(--critical)] focus-visible:border-[var(--critical)] focus-visible:ring-[var(--critical)]"
              : "border-[var(--border)]",
            className,
            "text-[16px] md:h-9 md:text-[13px]",
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
      </div>
    );
  },
);

Select.displayName = "Select";
