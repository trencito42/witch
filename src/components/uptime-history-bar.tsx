"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface DayUptime {
  dateStr: string;
  isoDate: string;
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
  const [tooltipState, setTooltipState] = React.useState<{
    x: number;
    arrowX: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (day: DayUptime, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredDay(day);
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = e.currentTarget.getBoundingClientRect();
      const relativeX = targetRect.left - containerRect.left + targetRect.width / 2;

      // Estimated half-width of tooltip is ~110px
      const halfWidth = 110;
      const minX = halfWidth;
      const maxX = Math.max(minX, containerRect.width - halfWidth);
      const clampedX = Math.max(minX, Math.min(relativeX, maxX));

      // Arrow offset relative to tooltip center
      const arrowX = relativeX - clampedX;
      setTooltipState({ x: clampedX, arrowX });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipState(null);
  };

  const tooltipText = (day: DayUptime) => {
    if (day.incidentCount > 0) return day.incidentSummary || String(day.incidentCount) + " incident(s)";
    if (day.status === "paused") return "Monitoring paused";
    if (day.status === "unknown") return "No HTTP monitoring data";
    return "No incidents reported";
  };

  return (
    <div className={cn("space-y-2 select-none", className)}>
      {/* Top row: Smoothly transitions between "90-Day History" and the hovered day's details */}
      <div className="flex items-center justify-between text-[12px] min-h-[22px]">
        <div className="flex-1 min-w-0 pr-3">
          {hoveredDay ? (
            <div className="flex items-center gap-1.5 text-[var(--text)] animate-in fade-in duration-100 min-w-0">
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  hoveredDay.status === "operational" && "bg-[var(--healthy)]",
                  hoveredDay.status === "degraded" && "bg-[var(--warning)]",
                  hoveredDay.status === "down" && "bg-[var(--critical)]",
                  hoveredDay.status === "paused" && "bg-[var(--text-faint)]",
                  hoveredDay.status === "unknown" && "bg-[var(--border-strong)]/60"
                )}
              />
              <span className="font-semibold shrink-0">{hoveredDay.dateStr}:</span>
              <span className="text-[var(--text-muted)] truncate">
                {hoveredDay.incidentCount > 0
                  ? hoveredDay.incidentSummary || `${hoveredDay.incidentCount} incident(s)`
                  : hoveredDay.status === "paused"
                  ? "Monitoring paused"
                  : hoveredDay.status === "unknown"
                  ? "No HTTP monitoring data"
                  : "No incidents reported"}
              </span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)] font-medium">90-Day History</span>
          )}
        </div>

        <span className="font-mono font-medium text-[var(--text)] tabular-nums shrink-0">
          {uptimePercentage === null ? "No data" : `${uptimePercentage.toFixed(2)}% uptime`}
        </span>
      </div>

      {/* Segments container with ample clearance for floating tooltip */}
      <div
        ref={containerRef}
        className="relative flex items-center gap-[2px] sm:gap-[3px] h-8 sm:h-9 w-full pt-1"
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover Tooltip (Clamped, will never bleed outside card boundaries) */}
        {hoveredDay && tooltipState && (
          <div
            className="absolute bottom-full mb-2 z-40 pointer-events-none -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-strong)] bg-[var(--surface-overlay)] px-3 py-1.5 text-[11px] shadow-xl animate-in fade-in zoom-in-95 duration-100"
            style={{ left: `${tooltipState.x}px` }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  hoveredDay.status === "operational" && "bg-[var(--healthy)]",
                  hoveredDay.status === "degraded" && "bg-[var(--warning)]",
                  hoveredDay.status === "down" && "bg-[var(--critical)]",
                  hoveredDay.status === "paused" && "bg-[var(--text-faint)]",
                  hoveredDay.status === "unknown" && "bg-[var(--border-strong)]/60",
                )}
              />
              <span className="font-semibold text-[var(--text)]">{hoveredDay.dateStr}:</span>
              <span className="text-[var(--text-muted)]">{tooltipText(hoveredDay)}</span>
            </div>
            {/* Arrow directly pointing to the segment */}
            <div
              className="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b border-[var(--border-strong)] bg-[var(--surface-overlay)]"
              style={{
                left: `calc(50% + ${tooltipState.arrowX}px - 4px)`,
              }}
            />
          </div>
        )}

        {days.map((day) => {
          const isHealthy = day.status === "operational";
          const isDegraded = day.status === "degraded";
          const isDown = day.status === "down";
          const isPaused = day.status === "paused";
          const isUnknown = day.status === "unknown";

          return (
            <div
              key={day.isoDate}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              className={cn(
                "h-full flex-1 rounded-[2px] transition-all duration-150 cursor-pointer",
                isHealthy && "bg-[var(--healthy)]/70 hover:bg-[var(--healthy)] hover:scale-y-110",
                isDegraded && "bg-[var(--warning)]/85 hover:bg-[var(--warning)] hover:scale-y-110",
                isDown && "bg-[var(--critical)]/90 hover:bg-[var(--critical)] hover:scale-y-110",
                isPaused && "bg-[var(--border-strong)]/40 hover:bg-[var(--border-strong)]",
                isUnknown && "bg-[var(--surface-overlay)] hover:bg-[var(--border-strong)]/60",
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
