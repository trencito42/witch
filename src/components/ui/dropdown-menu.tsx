"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface DropdownMenuItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block text-left", className)}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[160px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => {
            const content = (
              <>
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
              </>
            );

            const itemClass = cn(
              "flex w-full items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition-colors select-none cursor-pointer",
              item.danger
                ? "text-[var(--critical)] hover:bg-[rgba(248,113,113,0.12)]"
                : "text-[var(--text)] hover:bg-[var(--bg-hover)]",
              item.disabled && "opacity-40 pointer-events-none cursor-not-allowed",
            );

            return (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={itemClass}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
