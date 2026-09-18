"use client";

import * as React from "react";
import { DropdownMenu, type DropdownMenuItem, Dialog, DialogHeader, Button } from "@/components/ui";
import { MoreHorizontal, Shield, Trash2, ArrowRightLeft } from "lucide-react";
import {
  actionChangeRole,
  actionRemoveMember,
  actionTransfer,
} from "@/app/actions";
import { useToast } from "@/components/ui/toast";

export function MemberActionMenu({
  memberId,
  currentRole,
  isOwner,
}: {
  memberId: string;
  currentRole: string;
  isOwner: boolean;
}) {
  const { toast } = useToast();
  const [confirm, setConfirm] = React.useState<"transfer" | "remove" | null>(null);

  if (!isOwner || currentRole === "OWNER") {
    return null;
  }

  const items: DropdownMenuItem[] = [
    {
      label: currentRole === "ADMIN" ? "Set as Member" : "Promote to Admin",
      icon: <Shield className="h-3.5 w-3.5" />,
      onClick: async () => {
        try {
          const nextRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
          await actionChangeRole(memberId, nextRole);
          toast({ title: `Role changed to ${nextRole}`, type: "success" });
        } catch (err: unknown) {
          toast({ title: "Failed to change role", description: (err as Error)?.message, type: "error" });
        }
      },
    },
    {
      label: "Transfer Ownership",
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      onClick: () => setConfirm("transfer"),
    },
    {
      label: "Remove from Team",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      danger: true,
      onClick: () => setConfirm("remove"),
    },
  ];

  return (
    <>
      <DropdownMenu
        trigger={
          <button
            type="button"
            aria-label="Member actions"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={items}
      />
      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogHeader
          title={confirm === "transfer" ? "Transfer ownership?" : "Remove member?"}
          description={
            confirm === "transfer"
              ? "You will remain an Admin. This cannot be undone without another transfer."
              : "This member will lose access to the workspace."
          }
          onClose={() => setConfirm(null)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirm === "remove" ? "danger" : "primary"}
            onClick={async () => {
              const kind = confirm;
              setConfirm(null);
              try {
                if (kind === "transfer") {
                  await actionTransfer(memberId);
                  toast({ title: "Ownership transferred", type: "success" });
                } else if (kind === "remove") {
                  await actionRemoveMember(memberId);
                  toast({ title: "Member removed", type: "info" });
                }
              } catch (err: unknown) {
                toast({
                  title: kind === "transfer" ? "Failed to transfer ownership" : "Failed to remove member",
                  description: (err as Error)?.message,
                  type: "error",
                });
              }
            }}
          >
            {confirm === "transfer" ? "Transfer" : "Remove"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
