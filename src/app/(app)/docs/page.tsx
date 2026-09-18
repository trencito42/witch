import { PageHeader } from "@/components/page-header";

export default function DocsPage() {
  return (
    <div className="max-w-2xl text-[14px] text-[var(--text-muted)]">
      <PageHeader
        title="Documentation"
        description="How Witch watches a site after you add it."
      />
      <div className="space-y-4 leading-relaxed">
        <p>
          Witch monitors public websites with HTTP checks and Chromium. Add a site, wait for the first
          baseline, then use Run check after a deploy.
        </p>
        <p>
          Visual incidents can be accepted as a new baseline without deleting history. Email and AI
          analysis activate when those environment variables are present.
        </p>
      </div>
    </div>
  );
}
