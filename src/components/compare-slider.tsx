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
    <div className="relative overflow-hidden border border-[var(--border)] bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={beforeSrc} alt="Baseline" className="block w-full h-auto" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${value}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt="Current" className="block w-full max-w-none h-auto" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="absolute bottom-3 left-3 right-3"
      />
    </div>
  );
}
