import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50",
        className,
      )}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] mb-4 text-[var(--text-muted)] shadow-xs">
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-[var(--accent)]"
          >
            <circle cx="12" cy="12" r="9" className="opacity-20" />
            <circle cx="12" cy="12" r="4" className="opacity-50" />
            <circle cx="12" cy="12" r="1.5" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="21" />
          </svg>
        )}
      </div>
      <h3 className="text-[15px] font-medium text-[var(--text)] tracking-tight mb-1">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-[13px] text-[var(--text-muted)] leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
