import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-[var(--accent)] text-[#111] hover:bg-[var(--accent-strong)]",
    secondary:
      "border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-hover)]",
    ghost: "text-[var(--text-muted)] hover:text-[var(--text)]",
    danger: "text-[var(--critical)] hover:text-[#ff8a8a]",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center gap-2 px-3 text-[13px] font-medium transition-colors disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-8 w-full border border-[var(--border)] bg-transparent px-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-faint)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 border border-[var(--border)] bg-transparent px-2 text-[13px] text-[var(--text)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[12px] text-[var(--text-muted)]", className)}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    HEALTHY: "text-[var(--healthy)]",
    DEGRADED: "text-[var(--warning)]",
    DOWN: "text-[var(--critical)]",
    PAUSED: "text-[var(--text-muted)]",
    UNKNOWN: "text-[var(--text-muted)]",
    OPEN: "text-[var(--critical)]",
    ACKNOWLEDGED: "text-[var(--warning)]",
    RESOLVED: "text-[var(--healthy)]",
    IGNORED: "text-[var(--text-muted)]",
    CRITICAL: "text-[var(--critical)]",
    HIGH: "text-[var(--critical)]",
    MEDIUM: "text-[var(--warning)]",
    LOW: "text-[var(--info)]",
    INFO: "text-[var(--text-muted)]",
    Operational: "text-[var(--healthy)]",
    Degraded: "text-[var(--warning)]",
    Outage: "text-[var(--critical)]",
  };
  return (
    <span className={cn("text-[12px] uppercase tracking-[0.08em]", map[status] ?? "text-[var(--text-muted)]")}>
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
