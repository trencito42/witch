"use client";

import { useState } from "react";
import { actionDeleteSite } from "@/app/actions";
import { Button, Dialog, DialogHeader } from "@/components/ui";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteSiteButton({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setOpen(true)}
        leadingIcon={<Trash2 className="h-4 w-4" />}
      >
        Delete site
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Delete site surveillance?"
          description="This action cannot be undone. All synthetic check history, visual baseline snapshots, diffs, and incident telemetry will be permanently deleted."
          onClose={() => setOpen(false)}
        />

        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--critical-dim)] border border-[rgba(248,113,113,0.2)] text-[13px] text-[var(--critical)] mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Surveillance and alerts for this domain will cease immediately.</span>
        </div>

        <form
          action={async () => {
            setLoading(true);
            await actionDeleteSite(siteId);
          }}
          className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 [&_button]:w-full sm:[&_button]:w-auto"
        >
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
          >
            Permanently delete site
          </Button>
        </form>
      </Dialog>
    </>
  );
}

