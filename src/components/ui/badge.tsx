import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "warning" | "critical" | "info" | "outline" | "healthy" | "secondary";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)] border-[var(--border)]",
    secondary: "bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)] border-[var(--border)]",
    accent: "bg-[var(--accent-dim)] text-[var(--accent)] border-[rgba(187,242,176,0.3)]",
    healthy: "bg-[var(--healthy-dim)] text-[var(--healthy)] border-[rgba(52,211,153,0.3)]",
    warning: "bg-[var(--warning-dim)] text-[var(--warning)] border-[rgba(251,191,36,0.3)]",
    critical: "bg-[var(--critical-dim)] text-[var(--critical)] border-[rgba(248,113,113,0.3)]",
    info: "bg-[var(--info-dim)] text-[var(--info)] border-[rgba(96,165,250,0.3)]",
    outline: "bg-transparent text-[var(--text-muted)] border-[var(--border)]",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.2 text-[10px]",
    md: "px-2 py-0.5 text-[11px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium tracking-wide border",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
