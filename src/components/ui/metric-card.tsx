import * as React from "react";
import { cn } from "@/lib/cn";

export function MetricCard({
  label,
  value,
  secondary,
  extra,
  className,
}: {
  label: string;
  value: React.ReactNode;
  secondary?: React.ReactNode;
  extra?: React.ReactNode;
  indicator?: "healthy" | "warning" | "critical" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-sm transition-colors",
        className,
      )}
    >
      <div className="text-[12px] font-medium text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2 min-w-0">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-[var(--text)] break-words">
          {value}
        </div>
        {secondary && (
          <div className="mt-1 text-[12px] text-[var(--text-muted)] leading-snug">
            {secondary}
          </div>
        )}
      </div>
      {extra && <div className="mt-3 pt-2 border-t border-[var(--border)]">{extra}</div>}
    </div>
  );
}
