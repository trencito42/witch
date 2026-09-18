"use client";

import * as React from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button, Input, Label } from "@/components/ui";
import { Plus, Globe, ArrowRight } from "lucide-react";
import { actionCreateSite } from "@/app/actions";
import { useToast } from "@/components/ui/toast";

export function AddSiteButton({
  browserMonitoring = true,
  className,
}: {
  browserMonitoring?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        leadingIcon={<Plus className="h-4 w-4" />}
        className={className}
      >
        Add site
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Add website to watch"
          description={
            browserMonitoring
              ? "Witch will initiate automated HTTP checks, Chromium rendering, and create initial visual baselines."
              : "Witch will initiate automated HTTP surveillance."
          }
          onClose={() => setOpen(false)}
        />

        <form
          action={async (formData) => {
            setLoading(true);
            try {
              toast({
                title: "Registering site…",
                description: "Setting up surveillance monitors",
                type: "info",
              });
              await actionCreateSite(formData);
            } catch (err: unknown) {
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              trailingIcon={<ArrowRight className="h-4 w-4" />}
            >
              <span className="sm:hidden">Add site</span>
              <span className="hidden sm:inline">Deploy surveillance</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
