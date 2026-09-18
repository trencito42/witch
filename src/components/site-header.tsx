import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { getSession } from "@/server/session";

export async function SiteHeader({
  current,
}: {
  current?: "home" | "login" | "signup";
}) {
  const session = await getSession();
  const signedIn = Boolean(session?.user);

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-6 text-[13px] text-[var(--text-muted)]">
          <Link href="/#how" className="hidden hover:text-[var(--text)] sm:inline">
            How it works
          </Link>
          <Link href="/#pricing" className="hidden hover:text-[var(--text)] sm:inline">
            Pricing
          </Link>
          {signedIn ? (
            <Link href="/overview" className="hover:text-[var(--text)]">
              Open app
            </Link>
          ) : (
            <Link
              href="/login"
              className={current === "login" ? "text-[var(--text)]" : "hover:text-[var(--text)]"}
            >
              Sign in
            </Link>
          )}
          <Link
            href={signedIn ? "/sites" : "/signup"}
            className="inline-flex h-8 items-center bg-[var(--accent)] px-3 text-[13px] font-medium text-[#111]"
          >
            Start monitoring
          </Link>
        </nav>
      </div>
    </header>
  );
}
