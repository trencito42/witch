export const PLAN_IDS = ["free", "freelancer", "agency", "agency_pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanLimits = {
  id: PlanId;
  name: string;
  monthlyPriceUsd: number;
  description: string;
  maxSites: number;
  minHttpIntervalSeconds: number;
  minBrowserIntervalSeconds: number;
  browserMonitoring: boolean;
  visualMonitoring: boolean;
  emailAlerts: boolean;
  reports: boolean;
  maxMembers: number;
  historyDays: number;
  priorityChecks: boolean;
  advancedReporting: boolean;
  maxApiKeys: number;
  stripePriceEnv: string | null;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    description: "One site, HTTP monitoring, 30-minute interval.",
    maxSites: 1,
    minHttpIntervalSeconds: 1800,
    minBrowserIntervalSeconds: 86400,
    browserMonitoring: false,
    visualMonitoring: false,
    emailAlerts: false,
    reports: false,
    maxMembers: 1,
    historyDays: 7,
    priorityChecks: false,
    advancedReporting: false,
    maxApiKeys: 1,
    stripePriceEnv: null,
  },
  freelancer: {
    id: "freelancer",
    name: "Freelancer",
    monthlyPriceUsd: 9,
    description: "Five sites with browser, visual, alerts, and reports.",
    maxSites: 5,
    minHttpIntervalSeconds: 300,
    minBrowserIntervalSeconds: 900,
    browserMonitoring: true,
    visualMonitoring: true,
    emailAlerts: true,
    reports: true,
    maxMembers: 2,
    historyDays: 30,
    priorityChecks: false,
    advancedReporting: false,
    maxApiKeys: 5,
    stripePriceEnv: "STRIPE_PRICE_FREELANCER",
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPriceUsd: 24,
    description: "Twenty-five sites, team access, and longer history.",
    maxSites: 25,
    minHttpIntervalSeconds: 300,
    minBrowserIntervalSeconds: 900,
    browserMonitoring: true,
    visualMonitoring: true,
    emailAlerts: true,
    reports: true,
    maxMembers: 10,
    historyDays: 90,
    priorityChecks: false,
    advancedReporting: true,
    maxApiKeys: 20,
    stripePriceEnv: "STRIPE_PRICE_AGENCY",
  },
  agency_pro: {
    id: "agency_pro",
    name: "Agency Pro",
    monthlyPriceUsd: 49,
    description: "Seventy-five sites, priority checks, and advanced reporting.",
    maxSites: 75,
    minHttpIntervalSeconds: 300,
    minBrowserIntervalSeconds: 300,
    browserMonitoring: true,
    visualMonitoring: true,
    emailAlerts: true,
    reports: true,
    maxMembers: 25,
    historyDays: 180,
    priorityChecks: true,
    advancedReporting: true,
    maxApiKeys: 50,
    stripePriceEnv: "STRIPE_PRICE_AGENCY_PRO",
  },
};

export function getPlanLimits(planId: string | null | undefined): PlanLimits {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}

export function canCreateSite(planId: string, currentSiteCount: number) {
  const limits = getPlanLimits(planId);
  return currentSiteCount < limits.maxSites;
}

export function canUseBrowserMonitoring(planId: string) {
  return getPlanLimits(planId).browserMonitoring;
}

export function canUseVisualMonitoring(planId: string) {
  return getPlanLimits(planId).visualMonitoring;
}

export function canInviteMember(planId: string, currentMemberCount: number) {
  return currentMemberCount < getPlanLimits(planId).maxMembers;
}

export function canUseReports(planId: string) {
  return getPlanLimits(planId).reports;
}

export function canUseEmailAlerts(planId: string) {
  return getPlanLimits(planId).emailAlerts;
}

export function minIntervalForMonitor(
  planId: string,
  monitorType: "HTTP" | "BROWSER_DESKTOP" | "BROWSER_MOBILE" | "ELEMENT",
) {
  const limits = getPlanLimits(planId);
  if (monitorType === "HTTP") return limits.minHttpIntervalSeconds;
  return limits.minBrowserIntervalSeconds;
}
