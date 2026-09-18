"use client";

import { Button } from "@/components/ui";
import { Wordmark } from "@/components/logo";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-10 max-w-md space-y-3">
        <Wordmark className="justify-center" />
        <p className="text-[12px] uppercase tracking-wider text-[var(--critical)]">Observatory fault</p>
        <h1 className="text-[20px] font-medium text-[var(--text)]">Something went wrong</h1>
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
          The page failed to load. Try again, or return to Overview if the problem persists.
        </p>
        <div className="pt-2">
          <Button type="button" variant="primary" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
