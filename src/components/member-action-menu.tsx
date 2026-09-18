"use client";

import * as React from "react";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui";
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
      onClick: async () => {
        if (!confirm("Are you sure you want to transfer workspace ownership? You will remain an Admin.")) return;
        try {
          await actionTransfer(memberId);
          toast({ title: "Ownership transferred", type: "success" });
        } catch (err: unknown) {
          toast({ title: "Failed to transfer ownership", description: (err as Error)?.message, type: "error" });
        }
      },
    },
    {
      label: "Remove from Team",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      danger: true,
      onClick: async () => {
        if (!confirm("Remove this member from the workspace?")) return;
        try {
          await actionRemoveMember(memberId);
          toast({ title: "Member removed", type: "info" });
        } catch (err: unknown) {
          toast({ title: "Failed to remove member", description: (err as Error)?.message, type: "error" });
        }
      },
    },
  ];

  return (
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
  );
}
