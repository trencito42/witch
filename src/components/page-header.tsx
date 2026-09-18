export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
