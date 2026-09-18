import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireOrgContext } from "@/server/tenancy";
import { actionCreateSite } from "@/app/actions";
import { Button, Input, Label } from "@/components/ui";

export default async function OnboardingPage() {
  const ctx = await requireOrgContext();
  const existing = await db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, ctx.organizationId))
    .limit(1);
  if (existing[0]) redirect(`/sites/${existing[0].id}?onboarding=1`);

  return (
    <div className="max-w-lg">
      <p className="text-[12px] tracking-[0.18em] uppercase text-[var(--accent)] mb-3">Welcome to Witch</p>
      <h1 className="text-2xl mb-3">Add your first site</h1>
      <p className="text-[14px] text-[var(--text-muted)] mb-8">
        Enter a public URL. Witch will validate it, create default monitors, and capture the first baseline.
      </p>
      <form action={actionCreateSite} className="space-y-4">
        <div>
          <Label>Website URL</Label>
          <Input name="url" placeholder="https://example.com" required />
        </div>
        <div>
          <Label>Name (optional)</Label>
          <Input name="name" placeholder="Marketing site" />
        </div>
        <Button>Start first scan</Button>
      </form>
    </div>
  );
}
