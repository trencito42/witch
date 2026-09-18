"use client";

import { useState } from "react";

export function CompareSlider({
  beforeSrc,
  afterSrc,
}: {
  beforeSrc: string;
  afterSrc: string;
}) {
  const [value, setValue] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] select-none shadow-lg">
      {/* Before / Baseline image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={beforeSrc} alt="Baseline" className="block w-full h-auto pointer-events-none" />

      {/* After / Current clipped overlay */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden border-r border-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
        style={{ width: `${value}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt="Current"
          className="block w-full max-w-none h-auto pointer-events-none"
        />
      </div>

      {/* Splitter handle indicator */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--accent)] shadow-md pointer-events-none"
        style={{ left: `${value}%` }}
      >
        <span className="text-[10px] font-bold">⇄</span>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-medium text-[var(--accent)] border border-[rgba(187,242,176,0.2)]">
        Baseline
      </div>
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)]">
        Current
      </div>

      {/* Slider input */}
      <div className="absolute bottom-3 left-4 right-4 bg-black/60 backdrop-blur-xs px-3 py-2 rounded-lg border border-[var(--border)] flex items-center gap-3">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">Split: {value}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-[var(--accent)] cursor-pointer h-1.5 rounded-lg bg-[var(--bg-card)]"
        />
      </div>
    </div>
  );
}

