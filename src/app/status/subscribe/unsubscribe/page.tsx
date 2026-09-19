import Link from "next/link";
import { actionUnsubscribeStatusPage } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/logo";

export default async function UnsubscribeStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id = "", token = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] grid place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex mb-8"><Wordmark /></Link>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Stop status updates?</h1>
        <p className="mt-4 text-[14px] leading-6 text-[var(--text-muted)]">
          You will stop receiving incident and recovery emails for this public status page.
        </p>
        {id && token ? (
          <form action={actionUnsubscribeStatusPage} className="mt-8">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="token" value={token} />
            <Button type="submit" variant="primary">Unsubscribe</Button>
          </form>
        ) : (
          <p className="mt-8 text-[13px] text-[var(--critical)]">This unsubscribe link is incomplete.</p>
        )}
      </div>
    </main>
  );
}
