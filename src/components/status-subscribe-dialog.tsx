"use client";

import * as React from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionSubscribeStatusPage } from "@/app/actions";

interface StatusSubscribeDialogProps {
  organizationId: string;
  organizationName: string;
}

export function StatusSubscribeDialog({
  organizationId,
  organizationName,
}: StatusSubscribeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);\n  const [successMessage, setSuccessMessage] = React.useState("Check your inbox to confirm the subscription.");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("email", email);

      const res = await actionSubscribeStatusPage(formData);
      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setSuccess(false);
    setError(null);
    setEmail("");
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3.5 py-2 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--surface-overlay)] hover:border-[var(--border)] transition-all cursor-pointer shadow-sm active:translate-y-px"
      >
        <Bell className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span>Subscribe to updates</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title={`Subscribe to ${organizationName}`}
          description="Get automated incident notifications and recovery alerts directly to your inbox."
          onClose={() => setOpen(false)}
        />

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto w-11 h-11 rounded-full bg-[var(--healthy-dim)] border border-[var(--healthy)]/30 flex items-center justify-center text-[var(--healthy)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text)]">
              Check your inbox
            </h3>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xs mx-auto">
              {successMessage} <span className="font-mono text-[var(--text)]">{email}</span>
            </p>
            <div className="pt-3">
              <Button variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sub-email">Email address</Label>
              <Input
                id="sub-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg border border-[var(--critical)]/30 bg-[var(--critical-dim)] p-3 text-[12px] text-[var(--critical)]">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe to alerts"
                )}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
