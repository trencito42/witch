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
    <header
      className={`sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] ${
        current === "home" || current === "signup"
          ? "border-b border-white/[0.06] bg-[var(--bg)]/35 backdrop-blur-sm"
          : "border-b border-[var(--border)]/80 bg-[var(--surface-0)]/85 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
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
            className="inline-flex h-9 sm:h-8 items-center justify-center whitespace-nowrap rounded-md bg-[var(--accent)] px-3 text-[13px] sm:text-[12px] font-semibold tracking-wide text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent)]/90"
          >
            {signedIn ? "Sites" : "Start monitoring"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
