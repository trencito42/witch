"use client";

import { useState } from "react";
import { actionCreateKey } from "@/app/actions";
import { Button, Input } from "@/components/ui";

export function CreateKeyForm() {
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <form
      action={async (formData) => {
        const created = await actionCreateKey(formData);
        setSecret(created.secret);
      }}
      className="flex gap-2"
    >
      <Input name="name" placeholder="CI key" required />
      <Button variant="secondary">Create key</Button>
      {secret && (
        <p className="text-[12px] mono text-[var(--warning)]">
          Copy now: {secret}
        </p>
      )}
    </form>
  );
}
