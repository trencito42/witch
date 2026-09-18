import { SiteHeader } from "@/components/site-header";

export default function VerifyEmailPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-sm px-5 py-16 text-[14px] leading-relaxed text-[var(--text-muted)]">
        Check your inbox and follow the verification link. If email is not configured, you can
        sign in directly.
      </div>
    </>
  );
}
