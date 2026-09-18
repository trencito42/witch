"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-[14px]">
      <p>Something went wrong.</p>
      <button onClick={reset} className="text-[var(--accent)]">
        Try again
      </button>
    </div>
  );
}
