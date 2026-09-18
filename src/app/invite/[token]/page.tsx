import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/server/session";
import { acceptInvitation } from "@/features/team/service";
import { setActiveOrganization } from "@/server/tenancy";
import { Button } from "@/components/ui";
import { SiteHeader } from "@/components/site-header";
import { Users, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[var(--surface-0)]">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[420px]">
          <div className="relative rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-1)]/70 p-7 sm:p-9 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
            
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mb-4 text-[var(--accent)] shadow-[0_0_15px_rgba(187,242,176,0.1)]">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-[20px] font-semibold tracking-tight text-[var(--text)]">
                Join workspace
              </h1>
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                You&apos;ve been invited to collaborate. Accept this invitation with:
              </p>
              <div className="mt-2.5 inline-block px-3 py-1 rounded-md bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[12px] text-[var(--text)]">
                {session.user.email}
              </div>
            </div>

            <form action={accept}>
              <Button variant="primary" className="w-full h-10 font-semibold text-[13px] flex items-center justify-center gap-2">
                <span>Accept invitation</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
