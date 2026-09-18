"use client";

import { actionDeleteSite } from "@/app/actions";
import { Button } from "@/components/ui";

export function DeleteSiteButton({ siteId }: { siteId: string }) {
  return (
    <form
      action={actionDeleteSite.bind(null, siteId)}
      onSubmit={(event) => {
        if (!confirm("Delete this site and its monitoring data?")) event.preventDefault();
      }}
    >
      <Button variant="danger">Delete site</Button>
    </form>
  );
}
