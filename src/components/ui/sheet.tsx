"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useFocusTrap } from "./focus-trap";

export function Sheet({
  open,
  onOpenChange,
  children,
  side = "bottom",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "bottom" | "right";
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "fixed z-10 bg-[var(--bg-elevated)] border-[var(--border-strong)] p-6 shadow-2xl transition-transform duration-200 ease-out outline-none",
          side === "bottom"
            ? "inset-x-0 bottom-0 max-h-[min(90dvh,100svh)] rounded-t-2xl border-t overflow-y-auto pb-safe"
            : "inset-y-0 right-0 w-full max-w-sm border-l overflow-y-auto",
        )}
      >
        {side === "bottom" && (
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[rgba(255,255,255,0.15)]" />
        )}
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-[17px] font-medium tracking-tight text-[var(--text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[13px] text-[var(--text-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sheet"
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
