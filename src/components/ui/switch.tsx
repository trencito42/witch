"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, name, id, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const toggle = () => {
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={toggle}
        id={id}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out select-none",
          "focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          isChecked ? "bg-[var(--accent)]" : "bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)]",
          className,
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-xs transition-transform duration-200 ease-in-out",
            isChecked
              ? "translate-x-4 bg-[#0c140c]"
              : "translate-x-0 bg-[#d4d4d8]",
          )}
        />
        {name && (
          <input
            ref={ref}
            type="checkbox"
            name={name}
            checked={isChecked}
            onChange={(e) => {
              const next = e.target.checked;
              if (!isControlled) setInternalChecked(next);
              onCheckedChange?.(next);
            }}
            tabIndex={-1}
            className="sr-only"
            {...props}
          />
        )}
      </button>
    );
  },
);

Switch.displayName = "Switch";

export function SwitchRow({
  title,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  disabled,
  className,
}: {
  title: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <div
      onClick={toggle}
      className={cn(
        "group flex items-center justify-between gap-4 py-3 cursor-pointer select-none rounded-lg px-2 -mx-2 hover:bg-[var(--bg-hover)] transition-colors min-w-0",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <div className="space-y-0.5 pr-2 min-w-0">
        <div className="text-[14px] md:text-[13px] font-medium text-[var(--text)] group-hover:text-white transition-colors">
          {title}
        </div>
        {description && (
          <div className="text-[13px] md:text-[12px] text-[var(--text-muted)] leading-relaxed">
            {description}
          </div>
        )}
      </div>
      <Switch
        checked={isChecked}
        name={name}
        disabled={disabled}
        onCheckedChange={(c) => {
          if (!isControlled) setInternalChecked(c);
          onCheckedChange?.(c);
        }}
      />
    </div>
  );
}
