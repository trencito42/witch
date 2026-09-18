"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionJobStatus, actionRunCheck } from "@/app/actions";
import { Button } from "@/components/ui";

export function RunCheckButton({ siteId }: { siteId: string }) {
  const [state, setState] = useState<"idle" | "queued" | "checking" | "done" | "failed">("idle");
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state !== "queued" && state !== "checking") return;
    if (!jobIds.length) {
      const stop = setTimeout(() => setState("idle"), 8_000);
      return () => clearTimeout(stop);
    }
    let cancelled = false;
    const poll = async () => {
      const rows = await actionJobStatus(jobIds);
      if (cancelled) return;
      if (!rows.length) return;
      const done = rows.every((row) => ["completed", "failed", "cancelled"].includes(row.status));
      const failed = rows.some((row) => row.status === "failed");
      const running = rows.some((row) => row.status === "running");
      if (running || rows.some((row) => row.status === "pending")) setState("checking");
      if (done) {
        setState(failed ? "failed" : "done");
        router.refresh();
      }
    };
    void poll();
    const timer = setInterval(() => {
      void poll();
      router.refresh();
    }, 2500);
    const stop = setTimeout(() => {
      if (!cancelled) setState((current) => (current === "done" || current === "failed" ? current : "idle"));
    }, 90_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [state, jobIds, router]);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending || state === "queued" || state === "checking"}
      onClick={() =>
        start(async () => {
          setState("queued");
          const result = await actionRunCheck(siteId);
          setJobIds(result.jobIds ?? []);
          setState("checking");
        })
      }
    >
      {state === "idle" && "Run check"}
      {state === "queued" && "Queued"}
      {state === "checking" && "Checking…"}
      {state === "done" && "Done"}
      {state === "failed" && "Failed"}
    </Button>
  );
}
