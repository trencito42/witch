"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      trailingIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variantStyles = {
      primary:
        "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold hover:bg-[var(--accent-strong)] active:brightness-95 shadow-[0_1px_12px_var(--accent-glow)] border border-transparent",
      secondary:
        "bg-[var(--bg-card)] text-[var(--text)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] border border-[var(--border)] hover:border-[var(--border-strong)] shadow-xs",
      ghost:
        "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] border border-transparent",
      danger:
        "bg-[var(--critical-dim)] text-[var(--critical)] hover:bg-[rgba(248,113,113,0.22)] active:bg-[rgba(248,113,113,0.3)] border border-[rgba(248,113,113,0.2)]",
      outline:
        "bg-transparent text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-strong)]",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-[12px] gap-1.5 rounded-md",
      md: "h-9 px-3.5 text-[13px] gap-2 rounded-md",
      lg: "h-10 px-4 text-[14px] gap-2.5 rounded-lg",
      icon: "h-9 w-9 p-0 justify-center rounded-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
          "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-current shrink-0" />
        ) : (
          leadingIcon && <span className="shrink-0">{leadingIcon}</span>
        )}
        {children}
        {!loading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export function IconButton({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps & { "aria-label": string }) {
  return (
    <Button
      size="icon"
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
