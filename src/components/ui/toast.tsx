"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "warning" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ title, description, type = "info", duration = 4000 }: Omit<Toast, "id">) => {
      const id = `toast-${++toastCount}-${Date.now()}`;
      const newToast: Toast = { id, title, description, type, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100%-2rem)] left-4 right-4 lg:left-auto lg:right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-4 p-0 lg:p-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-[var(--bg-elevated)] shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-5",
              t.type === "success" && "border-[rgba(52,211,153,0.3)] text-[var(--healthy)]",
              t.type === "warning" && "border-[rgba(251,191,36,0.3)] text-[var(--warning)]",
              t.type === "error" && "border-[rgba(248,113,113,0.3)] text-[var(--critical)]",
              t.type === "info" && "border-[var(--border-strong)] text-[var(--text)]",
            )}
          >
            <span className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {t.type === "warning" && <AlertTriangle className="h-4 w-4" />}
              {t.type === "error" && <XCircle className="h-4 w-4" />}
              {t.type === "info" && <Info className="h-4 w-4 text-[var(--accent)]" />}
            </span>
            <div className="flex-1 space-y-0.5">
              <div className="text-[13px] font-medium text-[var(--text)]">{t.title}</div>
              {t.description && (
                <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                  {t.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] rounded-sm p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      dismiss: () => {},
      toasts: [],
    };
  }
  return ctx;
}
