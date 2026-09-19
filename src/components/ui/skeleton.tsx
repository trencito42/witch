import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--bg-hover)]",
        className,
      )}
      {...props}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-spectral-fade">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-spectral-fade" aria-busy="true" aria-label="Loading overview">
      {/* STATUS HEADER SKELETON */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <Skeleton className="h-7 w-56 max-w-[70%]" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full mt-2" />
          </div>
          <Skeleton className="h-11 w-full sm:w-28 rounded-lg shrink-0" />
        </div>
      </div>

      {/* 5 STAT CARDS SKELETON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] h-[108px]"
          >
            <Skeleton className="h-3.5 w-24" />
            <div className="space-y-1.5 mt-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
        <div className="col-span-2 sm:col-span-2 xl:col-span-1 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] h-[108px]">
          <Skeleton className="h-3.5 w-28" />
          <div className="space-y-1.5 mt-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* 3 SITE CARDS SKELETON */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3.5 w-60 max-w-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] h-[142px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Skeleton className="w-5 h-5 rounded-xs shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-28 max-w-full" />
                    <Skeleton className="h-3 w-36 max-w-full" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 INCIDENT ROWS & RECOVERIES SKELETON */}
      <div className="grid lg:grid-cols-12 gap-8 pt-2">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] min-h-[64px] gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-32 max-w-full" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] h-[64px] flex items-center">
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
