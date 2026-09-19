"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionJobStatus, actionRunCheck } from "@/app/actions";
import { Button } from "@/components/ui";
import { Play, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function RunCheckButton({
  siteId,
  compactOnMobile,
}: {
  siteId: string;
  compactOnMobile?: boolean;
}) {
  const [state, setState] = useState<"idle" | "queued" | "checking" | "done" | "failed">("idle");
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

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
        if (failed) {
          toast({
            title: "Check completed with issues",
            description: "One or more monitor checks reported a failure.",
            type: "warning",
          });
        } else {
          toast({
            title: "Check complete",
            description: "All monitoring checks finished successfully.",
            type: "success",
          });
        }
        router.refresh();
        setTimeout(() => setState("idle"), 4000);
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
  }, [state, jobIds, router, toast]);

  const labelClass = compactOnMobile ? "hidden sm:inline" : "";

  return (
    <Button
      type="button"
      variant={state === "done" ? "outline" : state === "failed" ? "danger" : "secondary"}
      disabled={pending || state === "queued" || state === "checking"}
      aria-label={state === "idle" ? "Run check" : state}
      onClick={() =>
        start(async () => {
          setState("queued");
          toast({
            title: "Check queued",
            description: "Dispatching HTTP and browser checks…",
            type: "info",
          });
          const result = await actionRunCheck(siteId);
          setJobIds(result.jobIds ?? []);
          setState("checking");
        })
      }
      className={`touch-target ${
        state === "checking"
          ? "border-[rgba(217,72,15,0.4)] text-[var(--accent)]"
          : state === "done"
            ? "border-[rgba(47,125,79,0.4)] text-[var(--healthy)]"
            : ""
      }`}
    >
      {state === "idle" && (
        <>
          <Play className="h-4 w-4 text-[var(--accent)]" />
          <span className={labelClass}>Run check</span>
        </>
      )}
      {state === "queued" && (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          <span className={labelClass}>Queued</span>
        </>
      )}
      {state === "checking" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          <span className={labelClass}>Scanning…</span>
        </>
      )}
      {state === "done" && (
        <>
          <CheckCircle2 className="h-4 w-4 text-[var(--healthy)]" />
          <span className={labelClass}>Complete</span>
        </>
      )}
      {state === "failed" && (
        <>
          <AlertTriangle className="h-4 w-4 text-[var(--critical)]" />
          <span className={labelClass}>Check failed</span>
        </>
      )}
    </Button>
  );
}

