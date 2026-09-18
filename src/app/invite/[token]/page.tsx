import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/server/session";
import { acceptInvitation } from "@/features/team/service";
import { setActiveOrganization } from "@/server/tenancy";
import { Button } from "@/components/ui";
import { SiteHeader } from "@/components/site-header";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await requireSession();
  const { token } = await params;
  async function accept() {
    "use server";
    const orgId = await acceptInvitation(session.user.id, session.user.email, token);
    await setActiveOrganization(orgId);
    redirect("/overview");
  }
  if (!token) notFound();
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-sm px-5 py-16">
        <h1 className="mb-3 text-[22px] font-medium tracking-tight">Join workspace</h1>
        <p className="mb-6 text-[13px] text-[var(--text-muted)]">
          Accept this invitation with {session.user.email}.
        </p>
        <form action={accept}>
          <Button>Accept invitation</Button>
        </form>
      </div>
    </>
  );
}
