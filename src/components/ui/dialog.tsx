"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "./focus-trap";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [mounted, setMounted] = React.useState(false);
  useFocusTrap(open, panelRef);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    if (open) {
      lockBodyScroll();
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (open) unlockBodyScroll();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const siblings = [...document.body.children].filter((node) => node !== overlay);
    for (const node of siblings) {
      if (node instanceof HTMLElement) node.inert = true;
    }
    return () => {
      for (const node of siblings) {
        if (node instanceof HTMLElement) node.inert = false;
      }
    };
  }, [open]);

  if (!open || !mounted) return null;

  const labelled = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === DialogHeader) {
      return React.cloneElement(child as React.ReactElement<{ titleId?: string; descriptionId?: string }>, {
        titleId,
        descriptionId,
      });
    }
    return child;
  });

  const node = (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg max-h-[min(90dvh,100svh)] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 outline-none"
      >
        {labelled}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

export function DialogHeader({
  title,
  description,
  onClose,
  titleId,
  descriptionId,
}: {
  title: string;
  description?: string;
  onClose?: () => void;
  titleId?: string;
  descriptionId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 id={titleId} className="text-[17px] font-medium tracking-tight text-[var(--text)]">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-1 text-[13px] text-[var(--text-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
