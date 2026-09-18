import * as React from "react";
import { cn } from "@/lib/cn";

export function MetricCard({
  label,
  value,
  secondary,
  indicator,
  className,
}: {
  label: string;
  value: React.ReactNode;
  secondary?: React.ReactNode;
  indicator?: "healthy" | "warning" | "critical" | "neutral";
  className?: string;
}) {
  const indicatorBorder = {
    healthy: "hover:border-[rgba(52,211,153,0.3)]",
    warning: "hover:border-[rgba(251,191,36,0.3)]",
    critical: "hover:border-[rgba(248,113,113,0.3)]",
    neutral: "hover:border-[var(--border-strong)]",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] transition-all duration-200 shadow-xs",
        indicator ? indicatorBorder[indicator] : "hover:border-[var(--border-strong)]",
        className,
      )}
    >
      <div className="text-[12px] font-medium tracking-wide text-[var(--text-muted)] uppercase mb-2">
        {label}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <div className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)]">
          {value}
        </div>
        {secondary && (
          <div className="text-[12px] text-[var(--text-muted)] mono">
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}
