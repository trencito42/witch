import Link from "next/link";
import { Wordmark, LogoMark } from "@/components/logo";
import { getSession } from "@/server/session";

export async function SiteHeader({
  current,
}: {
  current?: "home" | "login" | "signup";
}) {
  const session = await getSession();
  const signedIn = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--surface-0)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <LogoMark size={20} />
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-[13px]">
          <Link
            href="/#how"
            className="hidden text-[var(--text-muted)] transition-colors hover:text-[var(--text)] sm:inline"
          >
            How it works
          </Link>
          <Link
            href="/#pricing"
            className="hidden text-[var(--text-muted)] transition-colors hover:text-[var(--text)] sm:inline"
          >
            Pricing
          </Link>
          {signedIn ? (
            <Link
              href="/overview"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              Console
            </Link>
          ) : (
            <Link
              href="/login"
              className={`transition-colors ${
                current === "login"
                  ? "text-[var(--text)] font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Sign in
            </Link>
          )}
          <Link
            href={signedIn ? "/sites" : "/signup"}
            className="btn-primary inline-flex h-8 items-center justify-center rounded-md bg-[var(--accent)] px-3.5 text-[12px] font-semibold tracking-wide text-[#081008] shadow-[0_0_16px_rgba(187,242,176,0.18)] transition-all hover:bg-[var(--accent)]/90 active:scale-[0.98]"
          >
            {signedIn ? "Sites" : "Start monitoring"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
