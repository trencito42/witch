export const INTERVALS_SECONDS = {
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
} as const;

export type IntervalKey = keyof typeof INTERVALS_SECONDS;

export const INTERVAL_OPTIONS: { key: IntervalKey; label: string; seconds: number }[] =
  [
    { key: "5m", label: "Every 5 minutes", seconds: 300 },
    { key: "15m", label: "Every 15 minutes", seconds: 900 },
    { key: "30m", label: "Every 30 minutes", seconds: 1800 },
    { key: "1h", label: "Every hour", seconds: 3600 },
    { key: "6h", label: "Every 6 hours", seconds: 21600 },
    { key: "24h", label: "Every 24 hours", seconds: 86400 },
  ];

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: "Desktop" },
  mobile: { width: 390, height: 844, label: "Mobile" },
} as const;

export const VISUAL_SENSITIVITY = {
  LOW: { pixelThreshold: 0.2, changeRatio: 0.08, label: "Low" },
  MEDIUM: { pixelThreshold: 0.12, changeRatio: 0.03, label: "Medium" },
  HIGH: { pixelThreshold: 0.08, changeRatio: 0.01, label: "High" },
} as const;

export const MONITORING_THRESHOLDS = {
  overflowPx: 8,
  overflowRatio: 0.02,
  maxAutoMaskViewportRatio: 0.22,
  minChangedRegionPixels: 48,
  layoutSettleMs: 180,
  layoutSettleRounds: 6,
  stabilizeBudgetMs: 4_500,
  textReductionSignificant: 0.45,
  maxAutoMaskRegions: 12,
} as const;

export type VisualSensitivity = keyof typeof VISUAL_SENSITIVITY;

export const JOB_STALE_MS = 30 * 60 * 1000;
export const MANUAL_CHECK_COOLDOWN_SECONDS = 60;
export const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
export const MAX_DOM_TEXT_CHARS = 20_000;
export const MAX_CONSOLE_EVENTS = 40;
export const MAX_FAILED_REQUESTS = 80;
export const MAX_BROWSER_REQUESTS = 40;
export const MAX_BROWSER_BYTES = 8 * 1024 * 1024;
export const MAX_BROWSER_INFLIGHT = 4;
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_SUBRESOURCE_BYTES = 1 * 1024 * 1024;
export const JOB_RETENTION_DAYS = 7;

export const ORG_COOKIE = "witch_org";

export const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type OrgRole = (typeof ROLES)[number];

export const WRITE_ROLES: OrgRole[] = ["OWNER", "ADMIN", "MEMBER"];
export const ADMIN_ROLES: OrgRole[] = ["OWNER", "ADMIN"];
