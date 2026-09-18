"use client";

import { Button } from "@/components/ui";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      leadingIcon={<Printer className="h-3.5 w-3.5" />}
      onClick={() => window.print()}
    >
      Print / PDF Export
    </Button>
  );
}
