"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionJobStatus, actionRunCheck } from "@/app/actions";
import { Button } from "@/components/ui";
import { Play, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function RunCheckButton({ siteId }: { siteId: string }) {
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

  return (
    <Button
      type="button"
      variant={state === "done" ? "outline" : state === "failed" ? "danger" : "secondary"}
      disabled={pending || state === "queued" || state === "checking"}
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
      className={
        state === "checking"
          ? "border-[rgba(187,242,176,0.4)] text-[var(--accent)]"
          : state === "done"
            ? "border-[rgba(52,211,153,0.4)] text-[var(--healthy)]"
            : ""
      }
    >
      {state === "idle" && (
        <>
          <Play className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Run check</span>
        </>
      )}
      {state === "queued" && (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />
          <span>Queued</span>
        </>
      )}
      {state === "checking" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
          <span className="relative">
            Scanning…
            <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-[var(--accent)] animate-ping" />
          </span>
        </>
      )}
      {state === "done" && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--healthy)]" />
          <span>Complete</span>
        </>
      )}
      {state === "failed" && (
        <>
          <AlertTriangle className="h-3.5 w-3.5 text-[var(--critical)]" />
          <span>Check failed</span>
        </>
      )}
    </Button>
  );
}

