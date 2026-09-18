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
        "mb-8 flex flex-col gap-4 pb-6 border-b border-[var(--border)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1 max-w-2xl min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text)]">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="text-[14px] sm:text-[14px] leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:shrink-0 [&_button]:w-full sm:[&_button]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

