"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Search, X } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, trailingIcon, error, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leadingIcon && (
          <span className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "h-9 w-full rounded-md border bg-[var(--bg-elevated)] px-3 text-[13px] text-[var(--text)] transition-all duration-150",
            "placeholder:text-[var(--text-faint)]",
            "hover:border-[var(--border-strong)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] focus-visible:bg-[var(--bg-card)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error
              ? "border-[var(--critical)] focus-visible:border-[var(--critical)] focus-visible:ring-[var(--critical)]"
              : "border-[var(--border)]",
            leadingIcon && "pl-9",
            trailingIcon && "pr-9",
            className,
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-3 flex items-center text-[var(--text-muted)]">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[80px] rounded-md border bg-[var(--bg-elevated)] p-3 text-[13px] text-[var(--text)] transition-all duration-150",
          "placeholder:text-[var(--text-faint)]",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] focus-visible:bg-[var(--bg-card)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          error
            ? "border-[var(--critical)] focus-visible:border-[var(--critical)] focus-visible:ring-[var(--critical)]"
            : "border-[var(--border)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  className,
  ...props
}: InputProps & { onClear?: () => void }) {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 h-3.5 w-3.5 pointer-events-none text-[var(--text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-8 text-[13px] text-[var(--text)] transition-all duration-150",
          "placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] focus-visible:bg-[var(--bg-card)]",
        )}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 flex items-center justify-center h-4 w-4 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
