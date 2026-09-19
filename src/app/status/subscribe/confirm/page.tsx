import Link from "next/link";
import { actionConfirmStatusSubscriptionForm } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/logo";

export default async function ConfirmStatusSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string; done?: string }>;
}) {
  const { id = "", token = "", done } = await searchParams;
  const complete = done === "1";
  const invalid = done === "0";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] grid place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex mb-8"><Wordmark /></Link>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {complete ? "Status updates confirmed" : invalid ? "This confirmation link is invalid" : "Confirm status updates"}
        </h1>
        <p className="mt-4 text-[14px] leading-6 text-[var(--text-muted)]">
          {complete
            ? "You will now receive public incident and recovery updates for this status page."
            : invalid
              ? "The link may be incomplete or no longer match an active subscription."
              : "Confirm that you want incident and recovery notifications sent to this email address."}
        </p>

        {!done && id && token ? (
          <form action={actionConfirmStatusSubscriptionForm} className="mt-8">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="token" value={token} />
            <Button type="submit" variant="primary">Confirm updates</Button>
          </form>
        ) : null}

        {(!id || !token) && !done ? (
          <p className="mt-8 text-[13px] text-[var(--critical)]">This confirmation link is incomplete.</p>
        ) : null}

        {done ? (
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-full bg-[var(--text)] px-5 text-[13px] font-semibold text-[var(--bg)]"
          >
            Back to Witch
          </Link>
        ) : null}
      </div>
    </main>
  );
}
