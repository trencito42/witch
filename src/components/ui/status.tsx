import * as React from "react";
import { cn } from "@/lib/cn";

export type StatusType =
  | "HEALTHY"
  | "DEGRADED"
  | "DOWN"
  | "PAUSED"
  | "UNKNOWN"
  | "OPEN"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | "IGNORED"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO"
  | "Operational"
  | "Degraded"
  | "Outage"
  | string;

interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  pulse?: boolean;
  label: string;
}

export function getStatusConfig(status: StatusType): StatusConfig {
  const norm = status.toUpperCase();
  switch (norm) {
    case "HEALTHY":
    case "RESOLVED":
    case "OPERATIONAL":
      return {
        color: "text-[var(--healthy)]",
        bgColor: "bg-[var(--healthy-dim)]",
        borderColor: "border-[rgba(52,211,153,0.3)]",
        pulse: true,
        label: "Healthy",
      };
    case "DEGRADED":
    case "ACKNOWLEDGED":
    case "MEDIUM":
    case "WARNING":
      return {
        color: "text-[var(--warning)]",
        bgColor: "bg-[var(--warning-dim)]",
        borderColor: "border-[rgba(251,191,36,0.3)]",
        pulse: false,
        label: "Degraded",
      };
    case "DOWN":
    case "OPEN":
    case "CRITICAL":
    case "HIGH":
    case "OUTAGE":
      return {
        color: "text-[var(--critical)]",
        bgColor: "bg-[var(--critical-dim)]",
        borderColor: "border-[rgba(248,113,113,0.3)]",
        pulse: true,
        label: norm === "DOWN" ? "Down" : norm === "OPEN" ? "Open" : "Critical",
      };
    case "LOW":
    case "INFO":
      return {
        color: "text-[var(--info)]",
        bgColor: "bg-[var(--info-dim)]",
        borderColor: "border-[rgba(96,165,250,0.3)]",
        pulse: false,
        label: norm === "LOW" ? "Low" : "Info",
      };
    case "PAUSED":
      return {
        color: "text-[var(--text-muted)]",
        bgColor: "bg-[rgba(255,255,255,0.06)]",
        borderColor: "border-[rgba(255,255,255,0.1)]",
        pulse: false,
        label: "Paused",
      };
    case "IGNORED":
      return {
        color: "text-[var(--text-faint)]",
        bgColor: "bg-[rgba(255,255,255,0.04)]",
        borderColor: "border-[rgba(255,255,255,0.08)]",
        pulse: false,
        label: "Ignored",
      };
    default:
      return {
        color: "text-[var(--text-muted)]",
        bgColor: "bg-[rgba(255,255,255,0.05)]",
        borderColor: "border-[rgba(255,255,255,0.08)]",
        pulse: false,
        label: status.replace(/_/g, " ").toLowerCase(),
      };
  }
}

export function StatusDot({
  status,
  size = "md",
  className,
}: {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cfg = getStatusConfig(status);
  const sizeMap = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  const dotBgMap: Record<string, string> = {
    "text-[var(--healthy)]": "bg-[var(--healthy)]",
    "text-[var(--warning)]": "bg-[var(--warning)]",
    "text-[var(--critical)]": "bg-[var(--critical)]",
    "text-[var(--info)]": "bg-[var(--info)]",
    "text-[var(--text-muted)]": "bg-[var(--text-muted)]",
    "text-[var(--text-faint)]": "bg-[var(--text-faint)]",
  };
  const dotBg = dotBgMap[cfg.color] ?? "bg-[var(--text-muted)]";

  return (
    <span className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      {cfg.pulse && (
        <span
          className={cn(
            "absolute rounded-full animate-ping opacity-75",
            sizeMap[size],
            dotBg,
          )}
        />
      )}
      <span className={cn("rounded-full relative", sizeMap[size], dotBg)} />
    </span>
  );
}

export function StatusBadge({
  status,
  className,
  label,
  showDot = true,
}: {
  status: StatusType;
  className?: string;
  label?: string;
  showDot?: boolean;
}) {
  const cfg = getStatusConfig(status);
  const displayLabel =
    label ??
    (status.length <= 15
      ? status.replace(/_/g, " ").toLowerCase()
      : cfg.label.toLowerCase());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase border",
        cfg.bgColor,
        cfg.borderColor,
        cfg.color,
        className,
      )}
    >
      {showDot && <StatusDot status={status} size="sm" />}
      <span>{displayLabel}</span>
    </span>
  );
}

export function HealthBeacon({
  status,
  size = "md",
}: {
  status: "healthy" | "warning" | "critical" | "paused" | "degraded";
  size?: "sm" | "md" | "lg";
}) {
  const normalizedStatus = status === "degraded" ? "warning" : status;
  const colors = {
    healthy: "text-[var(--healthy)] border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.06)]",
    warning: "text-[var(--warning)] border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.06)]",
    critical: "text-[var(--critical)] border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.06)]",
    paused: "text-[var(--text-muted)] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]",
  };

  const ringSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("relative flex items-center justify-center rounded-full border", colors[normalizedStatus], ringSizes[size])}>
      <div className="absolute inset-0 rounded-full animate-radar opacity-40 bg-current" />
      <div className="h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
    </div>
  );
}

