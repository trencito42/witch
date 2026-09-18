import * as React from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--border)]",
        className,
      )}
    >
      <div className="space-y-1 max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)]">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="text-[13px] sm:text-[14px] leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

