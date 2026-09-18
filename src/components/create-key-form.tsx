"use client";

import { useState } from "react";
import { actionCreateKey } from "@/app/actions";
import { Button, Input } from "@/components/ui";
import { Key, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CreateKeyForm() {
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast({ title: "API key copied to clipboard", type: "success" });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-4">
      <form
        action={async (formData) => {
          setLoading(true);
          try {
            const created = await actionCreateKey(formData);
            setSecret(created.secret);
            toast({ title: "API key generated successfully", type: "success" });
          } catch (err: unknown) {
            toast({
              title: "Failed to generate key",
              description: (err as Error)?.message,
              type: "error",
            });
          } finally {
            setLoading(false);
          }
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <Input
          name="name"
          placeholder="Key name (e.g. GitHub Actions, Production CI)"
          required
          className="flex-1"
          leadingIcon={<Key className="h-4 w-4" />}
        />
        <Button
          type="submit"
          variant="secondary"
          loading={loading}
        >
          Create API key
        </Button>
      </form>

      {secret && (
        <div className="p-4 rounded-xl border border-[rgba(251,191,36,0.3)] bg-[var(--warning-dim)] space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--warning)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Save your secret key now. It will never be displayed again.</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <code className="flex-1 mono text-[12px] text-[var(--text)] select-all break-all">
              {secret}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leadingIcon={copied ? <Check className="h-3.5 w-3.5 text-[var(--healthy)]" /> : <Copy className="h-3.5 w-3.5" />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

