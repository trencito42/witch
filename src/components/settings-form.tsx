"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function SaveButton({
  label = "Save changes",
  loadingLabel = "Saving...",
  variant = "primary",
  size = "md",
  className,
}: {
  label?: string;
  loadingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={pending}
      disabled={pending}
      className={className}
    >
      {pending ? loadingLabel : label}
    </Button>
  );
}

export function SettingsForm({
  action,
  successTitle = "Changes saved",
  successDescription = "Your settings have been updated successfully.",
  children,
  className,
}: {
  action: (formData: FormData) => Promise<unknown>;
  successTitle?: string;
  successDescription?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { toast } = useToast();

  const handleFormAction = async (formData: FormData) => {
    try {
      await action(formData);
      toast({
        title: successTitle,
        description: successDescription,
        type: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to save",
        description: (err as Error)?.message || "An unexpected error occurred. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <form action={handleFormAction} className={className}>
      {children}
    </form>
  );
}
