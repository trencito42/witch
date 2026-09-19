"use client";

import { useState, useRef, useCallback, type PointerEvent, type KeyboardEvent } from "react";

export interface CompareSliderProps {
  beforeSrc: string; // Baseline
  afterSrc: string;  // Current
  initialValue?: number;
  className?: string;
  onValueChange?: (value: number) => void;
}

export function CompareSlider({
  beforeSrc,
  afterSrc,
  initialValue = 50,
  className = "",
  onValueChange,
}: CompareSliderProps) {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const raw = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
      setValue(clamped);
      onValueChange?.(clamped);
    },
    [onValueChange],
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      delta = e.shiftKey ? -10 : -2;
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      delta = e.shiftKey ? 10 : 2;
    } else if (e.key === "Home") {
      setValue(0);
      onValueChange?.(0);
      return;
    } else if (e.key === "End") {
      setValue(100);
      onValueChange?.(100);
      return;
    }
    if (delta !== 0) {
      e.preventDefault();
      setValue((prev) => {
        const next = Math.max(0, Math.min(100, prev + delta));
        onValueChange?.(next);
        return next;
      });
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Visual comparison slider"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] select-none cursor-ew-resize focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] shadow-lg touch-none ${className}`}
    >
      {/* Bottom Layer: Current image (right side of divider) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt="Current snapshot"
        data-testid="current-image"
        className="block w-full h-auto pointer-events-none"
      />

      {/* Top Layer: Baseline image (left side of divider, revealed via clipPath) */}
      <div
        data-testid="baseline-clip-container"
        className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - value}% 0 0)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt="Baseline snapshot"
          data-testid="baseline-image"
          className="block w-full h-auto pointer-events-none"
        />
      </div>

      {/* Vertical divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-[var(--accent)] pointer-events-none -translate-x-1/2 shadow-[0_0_8px_rgba(187,242,176,0.5)] transition-opacity"
        style={{ left: `${value}%` }}
      />

      {/* Minimalist divider handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center h-7 w-7 rounded-full bg-[var(--bg)] border border-[var(--accent)] text-[var(--accent)] shadow-md pointer-events-none transition-transform group-active:scale-110"
        style={{ left: `${value}%` }}
      >
        <span className="text-[10px] font-bold tracking-tighter">⇄</span>
      </div>

      {/* Left semantic label: Baseline */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-medium text-[var(--accent)] border border-[rgba(187,242,176,0.25)] pointer-events-none">
        Baseline
      </div>

      {/* Right semantic label: Current */}
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)] pointer-events-none">
        Current
      </div>

      {/* Compact percentage indicator while active / hovering */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[11px] font-mono text-[var(--text)] border border-white/15 pointer-events-none transition-opacity duration-150 ${
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {Math.round(value)}%
      </div>
    </div>
  );
}
