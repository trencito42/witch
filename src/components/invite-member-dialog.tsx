"use client";

import * as React from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button, Input, Label, Select } from "@/components/ui";
import { UserPlus, Mail, ArrowRight } from "lucide-react";
import { actionInvite } from "@/app/actions";
import { useToast } from "@/components/ui/toast";

export function InviteMemberDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
        leadingIcon={<UserPlus className="h-3.5 w-3.5" />}
      >
        Invite member
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Invite team member"
          description="Invite someone to this workspace, alerts, and incidents."
          onClose={() => setOpen(false)}
        />

        <form
          action={async (formData) => {
            setLoading(true);
            try {
              await actionInvite(formData);
              setOpen(false);
              toast({
                title: "Invitation sent",
                description: "The recipient will receive an invitation link.",
                type: "success",
              });
            } catch (err: unknown) {
              toast({
                title: "Failed to send invite",
                description: (err as Error)?.message || "Please check email and try again.",
                type: "error",
              });
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <Label htmlFor="invite-email" required>
              Email address
            </Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="colleague@agency.com"
              required
              autoFocus
              leadingIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="invite-role">Workspace Role</Label>
            <Select id="invite-role" name="role" defaultValue="MEMBER">
              <option value="MEMBER">Member (view & manage monitors)</option>
              <option value="ADMIN">Admin (manage team & billing)</option>
              <option value="VIEWER">Viewer (read-only access)</option>
            </Select>
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
              Send invitation
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
