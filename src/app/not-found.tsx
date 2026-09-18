import Link from "next/link";
import { Wordmark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-[14px] text-[var(--text-muted)]">
      <Wordmark />
      <p>That page does not exist.</p>
      <Link href="/" className="prose-link text-[var(--text)]">
        Back to Witch
      </Link>
    </div>
  );
}
