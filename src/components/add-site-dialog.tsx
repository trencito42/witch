"use client";

import * as React from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button, Input, Label } from "@/components/ui";
import { Plus, Globe, ArrowRight } from "lucide-react";
import { actionCreateSite } from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import { isNextNavigationError } from "@/lib/navigation-error";
import { cn } from "@/lib/cn";

export function AddSiteDialog({
  open,
  onOpenChange,
  browserMonitoring = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  browserMonitoring?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader
        title="Add website to watch"
        description={
          browserMonitoring
            ? "Witch will initiate automated HTTP checks, Chromium rendering, and create initial visual baselines."
            : "Witch will run automated HTTP and TLS checks."
        }
        onClose={() => onOpenChange(false)}
      />

      <form
        action={async (formData) => {
          setLoading(true);
          try {
            toast({
              title: "Registering site…",
              description: "Queuing the first checks",
              type: "info",
            });
            await actionCreateSite(formData);
          } catch (err: unknown) {
            if (isNextNavigationError(err)) throw err;
            setLoading(false);
            toast({
              title: "Failed to add site",
              description: (err as Error)?.message || "Please check URL and try again.",
              type: "error",
            });
          }
        }}
        className="space-y-4 pt-2"
      >
        <div>
          <Label htmlFor="site-url" required>
            Website URL
          </Label>
          <Input
            id="site-url"
            name="url"
            type="url"
            placeholder="https://example.com"
            required
            autoFocus
            className="mono"
            leadingIcon={<Globe className="h-4 w-4" />}
          />
        </div>

        <div>
          <Label htmlFor="site-name">
            Friendly name <span className="text-[var(--text-faint)]">(optional)</span>
          </Label>
          <Input
            id="site-name"
            name="name"
            placeholder="e.g. Production Store"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 [&_button]:w-full sm:[&_button]:w-auto">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            trailingIcon={<ArrowRight className="h-4 w-4" />}
          >
            Add site
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddSiteButton({
  browserMonitoring = true,
  className,
  children,
  disabled = false,
}: {
  browserMonitoring?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        leadingIcon={<Plus className="h-4 w-4" />}
        className={className}
      >
        {children ?? "Add site"}
      </Button>

      <AddSiteDialog
        open={open}
        onOpenChange={setOpen}
        browserMonitoring={browserMonitoring}
      />
    </>
  );
}

export function AddSiteCardButton({
  browserMonitoring = true,
  className,
}: {
  browserMonitoring?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-[var(--border-strong)] bg-transparent min-h-[140px] text-center transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 [@media(pointer:fine)]:hover:bg-[var(--surface)] [@media(pointer:fine)]:hover:border-[var(--accent)] cursor-pointer w-full",
          className
        )}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/30 transition-colors mb-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="text-[13px] font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
          Add another site
        </span>
        <span className="text-[12px] text-[var(--text-muted)] mt-0.5">
          {browserMonitoring ? "Watch HTTP, browser & visual diffs" : "Watch HTTP, TLS & latency"}
        </span>
      </button>

      <AddSiteDialog
        open={open}
        onOpenChange={setOpen}
        browserMonitoring={browserMonitoring}
      />
    </>
  );
}
