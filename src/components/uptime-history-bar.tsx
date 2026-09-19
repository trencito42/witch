"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface DayUptime {
  dateStr: string; // "Sep 19, 2026"
  isoDate: string; // "2026-09-19"
  status: "operational" | "degraded" | "down" | "paused" | "unknown";
  incidentCount: number;
  incidentSummary?: string;
}

interface UptimeHistoryBarProps {
  days: DayUptime[];
  uptimePercentage: number | null;
  className?: string;
}

export function UptimeHistoryBar({
  days,
  uptimePercentage,
  className,
}: UptimeHistoryBarProps) {
  const [hoveredDay, setHoveredDay] = React.useState<DayUptime | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (day: DayUptime, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredDay(day);
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = e.currentTarget.getBoundingClientRect();
      const relativeX = targetRect.left - containerRect.left + targetRect.width / 2;
      setTooltipPos({ x: relativeX });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  return (
    <div className={cn("space-y-2 select-none", className)}>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-[var(--text-muted)] font-medium">90-Day History</span>
        <span className="font-mono font-medium text-[var(--text)] tabular-nums">
          {uptimePercentage.toFixed(2)}% uptime
        </span>
      </div>

      {/* Segments container */}
      <div
        ref={containerRef}
        className="relative flex items-center gap-[2px] sm:gap-[3px] h-8 sm:h-9 w-full"
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover Tooltip */}
        {hoveredDay && tooltipPos && (
          <div
            className="absolute -top-12 z-30 pointer-events-none -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-strong)] bg-[var(--surface-overlay)] px-2.5 py-1 text-[11px] shadow-lg animate-in fade-in zoom-in-95 duration-100"
            style={{ left: `${tooltipPos.x}px` }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hoveredDay.status === "operational" && "bg-[var(--healthy)]",
                  hoveredDay.status === "degraded" && "bg-[var(--warning)]",
                  hoveredDay.status === "down" && "bg-[var(--critical)]",
                  hoveredDay.status === "paused" && "bg-[var(--text-faint)]",\n                  hoveredDay.status === "unknown" && "bg-[var(--border-strong)]/60"
                )}
              />
              <span className="font-semibold text-[var(--text)]">{hoveredDay.dateStr}:</span>
              <span className="text-[var(--text-muted)]">
                {hoveredDay.incidentCount > 0
                  ? hoveredDay.incidentSummary || `${hoveredDay.incidentCount} incident(s)`
                  : hoveredDay.status === "paused"
                  ? "Monitoring paused"
                  : "No incidents reported"}
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-[var(--border-strong)] bg-[var(--surface-overlay)]" />
          </div>
        )}

        {days.map((day) => {
          const isHealthy = day.status === "operational";
          const isDegraded = day.status === "degraded";
          const isDown = day.status === "down";
          const isPaused = day.status === "paused";\n          const isUnknown = day.status === "unknown";

          return (
            <div
              key={day.isoDate}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              className={cn(
                "h-full flex-1 rounded-[2px] transition-all duration-150 cursor-pointer",
                isHealthy && "bg-[var(--healthy)]/70 hover:bg-[var(--healthy)] hover:scale-y-110",
                isDegraded && "bg-[var(--warning)]/85 hover:bg-[var(--warning)] hover:scale-y-110",
                isDown && "bg-[var(--critical)]/90 hover:bg-[var(--critical)] hover:scale-y-110",
                isPaused && "bg-[var(--border-strong)]/40 hover:bg-[var(--border-strong)]",\n                isUnknown && "bg-[var(--surface-overlay)] hover:bg-[var(--border-strong)]/60"
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)]">
        <span>90 days ago</span>
        <span className="h-[1px] flex-1 mx-3 bg-[var(--border)]" />
        <span>Today</span>
      </div>
    </div>
  );
}
