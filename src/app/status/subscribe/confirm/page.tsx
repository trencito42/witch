import Link from "next/link";
import { actionConfirmStatusSubscription } from "@/app/actions";
import { Wordmark } from "@/components/logo";

export default async function ConfirmStatusSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id = "", token = "" } = await searchParams;
  const confirmed = id && token ? await actionConfirmStatusSubscription(id, token) : false;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] grid place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex mb-8"><Wordmark /></Link>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {confirmed ? "Status updates confirmed" : "This confirmation link is invalid"}
        </h1>
        <p className="mt-4 text-[14px] leading-6 text-[var(--text-muted)]">
          {confirmed
            ? "You will now receive public incident and recovery updates for this status page."
            : "The link may be incomplete or no longer match an active subscription."}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-full bg-[var(--text)] px-5 text-[13px] font-semibold text-[var(--bg)]"
        >
          Back to Witch
        </Link>
      </div>
    </main>
  );
}
