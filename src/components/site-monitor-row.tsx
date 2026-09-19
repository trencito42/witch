"use client";

import * as React from "react";
import { StatusDot } from "@/components/ui/status";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface MonitorRowProps {
  monitor: {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    intervalSeconds: number;
    lastRunAt: Date | string | null;
    nextRunAt: Date | string;
  };
  intervalOptions: readonly { key: string; label: string; seconds: number }[];
  action: (formData: FormData) => Promise<void>;
}

function formatRelative(date: Date | string | null, isFuture = false): string {
  if (!date) return "Never";
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffSec = Math.round((target - now) / 1000);
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return isFuture ? "in under a min" : "just now";
  const min = Math.round(absSec / 60);
  if (min < 60) return isFuture ? `in ${min} min` : `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return isFuture ? `in ${hr}h` : `${hr}h ago`;
  const days = Math.round(hr / 24);
  return isFuture ? `in ${days}d` : `${days}d ago`;
}

export function SiteMonitorRow({
  monitor,
  intervalOptions,
  action,
}: MonitorRowProps) {
  const defaultIntervalKey =
    intervalOptions.find((i) => i.seconds === monitor.intervalSeconds)?.key ?? "30m";

  const [enabled, setEnabled] = React.useState(monitor.enabled);
  const [intervalKey, setIntervalKey] = React.useState(defaultIntervalKey);
  const [saved, setSaved] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const isDirty = enabled !== monitor.enabled || intervalKey !== defaultIntervalKey;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Ensure enabled is present if checked
    if (enabled) {
      formData.set("enabled", "on");
    } else {
      formData.delete("enabled");
    }
    formData.set("interval", intervalKey);

    startTransition(async () => {
      await action(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const lastAbsolute = monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleString() : "Never executed";
  const nextAbsolute = new Date(monitor.nextRunAt).toLocaleString();

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
    >
      {/* Title & Info */}
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusDot status={enabled ? "HEALTHY" : "NEUTRAL"} size="sm" />
          <span className="text-[15px] font-medium text-[var(--text)]">
            {monitor.name}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
            {monitor.type}
          </span>
        </div>
        <div className="text-[13px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
          <span>
            Last:{" "}
            <span title={lastAbsolute} className="text-[var(--text)] underline decoration-dotted underline-offset-2">
              {formatRelative(monitor.lastRunAt, false)}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            Next:{" "}
            <span title={nextAbsolute} className="text-[var(--text)] underline decoration-dotted underline-offset-2">
              {formatRelative(monitor.nextRunAt, true)}
            </span>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        {/* Toggle Switch */}
        <label className="flex items-center justify-between sm:justify-start gap-2.5 text-[14px] text-[var(--text)] cursor-pointer touch-target select-none">
          <span className="text-[13px] text-[var(--text-muted)] sm:hidden">Monitor Active</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
              enabled ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="hidden sm:inline text-[13px] text-[var(--text-muted)]">
            {enabled ? "Active" : "Disabled"}
          </span>
        </label>

        {/* Full-label Select */}
        <div className="w-full sm:w-44">
          <select
            name="interval"
            value={intervalKey}
            onChange={(e) => setIntervalKey(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[14px] sm:text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] touch-target cursor-pointer"
          >
            {intervalOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dirty-only Save button with saved confirmation */}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!isDirty || isPending}
            className="w-full sm:w-auto touch-target"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          {saved && (
            <span className="text-[12px] font-medium text-[var(--healthy)] flex items-center gap-1 shrink-0 animate-in fade-in duration-150">
              <Check className="h-3.5 w-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
