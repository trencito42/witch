"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionRunCheck } from "@/app/actions";
import { Button } from "@/components/ui";

export function RunCheckButton({ siteId }: { siteId: string }) {
  const [state, setState] = useState<"idle" | "queued" | "checking">("idle");
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state === "idle") return;
    const timer = setInterval(() => router.refresh(), 2500);
    const stop = setTimeout(() => setState("idle"), 45_000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [state, router]);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setState("queued");
          await actionRunCheck(siteId);
          setState("checking");
        })
      }
    >
      {state === "idle" && "Run check"}
      {state === "queued" && "Queued"}
      {state === "checking" && "Checking…"}
    </Button>
  );
}
