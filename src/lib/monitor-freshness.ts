export function isMonitoringStale(input: {
  lastCheckedAt?: Date | null;
  createdAt?: Date | null;
  pausedAt?: Date | null;
  intervalSeconds?: number;
  now?: Date;
}) {
  if (input.pausedAt) return false;
  const now = input.now ?? new Date();
  const intervalMs = Math.max(input.intervalSeconds ?? 1800, 300) * 1000;
  const staleAfter = Math.min(intervalMs * 3, 2 * 60 * 60 * 1000);
  if (input.lastCheckedAt) {
    return now.getTime() - input.lastCheckedAt.getTime() > staleAfter;
  }
  if (input.createdAt) {
    return now.getTime() - input.createdAt.getTime() > Math.max(staleAfter, 15 * 60 * 1000);
  }
  return false;
}

export function siteWatchPresentation(site: {
  status: string;
  lastCheckedAt?: Date | null;
  createdAt?: Date | null;
  pausedAt?: Date | null;
}) {
  if (site.status === "PAUSED") return { status: site.status, label: "Paused", stale: false };
  if (site.status === "DOWN" || site.status === "DEGRADED") {
    return { status: site.status, stale: false };
  }
  const stale = isMonitoringStale(site);
  if (stale) return { status: "UNKNOWN", label: "Check delayed", stale: true };
  return { status: site.status, stale: false };
}
