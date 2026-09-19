import {
  mysqlTable,
  varchar,
  text,
  datetime,
  boolean,
  int,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const id = (name = "id") => varchar(name, { length: 36 });
const datetimeRequired = (name: string) =>
  datetime(name, { mode: "date", fsp: 3 }).notNull();
const datetimeOptional = (name: string) =>
  datetime(name, { mode: "date", fsp: 3 });

export const users = mysqlTable("user", {
  id: id().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  lastLoginAt: datetimeOptional("last_login_at"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: datetimeRequired("created_at"),
  updatedAt: datetimeRequired("updated_at"),
});

export const sessions = mysqlTable(
  "session",
  {
    id: id().primaryKey(),
    expiresAt: datetimeRequired("expires_at"),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    userId: id("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const accounts = mysqlTable(
  "account",
  {
    id: id().primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: id("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: datetimeOptional("access_token_expires_at"),
    refreshTokenExpiresAt: datetimeOptional("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verifications = mysqlTable(
  "verification",
  {
    id: id().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: datetimeRequired("expires_at"),
    createdAt: datetimeOptional("created_at"),
    updatedAt: datetimeOptional("updated_at"),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organizations = mysqlTable(
  "organization",
  {
    id: id().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    billingEmail: varchar("billing_email", { length: 255 }),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    statusPageEnabled: boolean("status_page_enabled").notNull().default(false),
    statusPageSlug: varchar("status_page_slug", { length: 80 }).unique(),
    statusPageHeadline: varchar("status_page_headline", { length: 160 }),
    statusPageSubheadline: varchar("status_page_subheadline", { length: 255 }),
    statusPageAllowSubscribe: boolean("status_page_allow_subscribe")
      .notNull()
      .default(true),
    statusPageShowHistoryBars: boolean("status_page_show_history_bars")
      .notNull()
      .default(true),
    alertOnIncident: boolean("alert_on_incident").notNull().default(true),
    alertOnRecovery: boolean("alert_on_recovery").notNull().default(true),
    monthlyReportsEnabled: boolean("monthly_reports_enabled")
      .notNull()
      .default(true),
    minAlertSeverity: varchar("min_alert_severity", { length: 16 })
      .notNull()
      .default("LOW"),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [index("org_status_slug_idx").on(table.statusPageSlug)],
);

export const statusPageSubscribers = mysqlTable(
  "status_page_subscriber",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    confirmedAt: datetimeOptional("confirmed_at"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    uniqueIndex("status_page_sub_org_email_unique").on(table.organizationId, table.email),
    index("status_page_sub_org_idx").on(table.organizationId),
  ],
);

export const organizationMembers = mysqlTable(
  "organization_member",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: id("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    uniqueIndex("org_member_unique").on(table.organizationId, table.userId),
    index("org_member_user_idx").on(table.userId),
  ],
);

export const organizationInvitations = mysqlTable(
  "organization_invitation",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    invitedByUserId: id("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: datetimeRequired("expires_at"),
    acceptedAt: datetimeOptional("accepted_at"),
    revokedAt: datetimeOptional("revoked_at"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("invite_org_idx").on(table.organizationId),
    index("invite_email_idx").on(table.email),
  ],
);

export const subscriptions = mysqlTable(
  "subscription",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 32 }).notNull().default("free"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
    stripePriceId: varchar("stripe_price_id", { length: 64 }),
    currentPeriodStart: datetimeOptional("current_period_start"),
    currentPeriodEnd: datetimeOptional("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    trialEndsAt: datetimeOptional("trial_ends_at"),
    lastStripeEventCreated: int("last_stripe_event_created"),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [
    index("sub_customer_idx").on(table.stripeCustomerId),
    index("sub_stripe_idx").on(table.stripeSubscriptionId),
  ],
);

export const billingEvents = mysqlTable(
  "billing_event",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    stripeEventId: varchar("stripe_event_id", { length: 255 }).notNull().unique(),
    type: varchar("type", { length: 64 }).notNull(),
    processedAt: datetimeRequired("processed_at"),
    payloadSummary: json("payload_summary"),
  },
  (table) => [index("billing_org_idx").on(table.organizationId)],
);

export type VisualNoiseSettings = {
  ignoreCookieConsent?: boolean;
  ignoreChatWidgets?: boolean;
  ignoreMarketingPopups?: boolean;
  ignoreAds?: boolean;
  ignoreStickyPromos?: boolean;
  cleanCapture?: boolean;
  autoDismissConsent?: boolean;
  colorScheme?: "light" | "dark" | "default";
};

export const sites = mysqlTable(
  "site",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    normalizedUrl: varchar("normalized_url", { length: 2048 }).notNull(),
    faviconUrl: varchar("favicon_url", { length: 2048 }),
    status: varchar("status", { length: 16 }).notNull().default("UNKNOWN"),
    visualSensitivity: varchar("visual_sensitivity", { length: 16 })
      .notNull()
      .default("MEDIUM"),
    ignoreSelectors: json("ignore_selectors"),
    visualNoiseSettings: json("visual_noise_settings").$type<VisualNoiseSettings>(),
    pausedAt: datetimeOptional("paused_at"),
    lastCheckedAt: datetimeOptional("last_checked_at"),
    lastHealthyAt: datetimeOptional("last_healthy_at"),
    statusPageVisible: boolean("status_page_visible").notNull().default(true),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [
    index("site_org_idx").on(table.organizationId),
    index("site_org_status_idx").on(table.organizationId, table.status),
    uniqueIndex("site_org_url_idx").on(table.organizationId, table.normalizedUrl),
  ],
);

export const monitors = mysqlTable(
  "monitor",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    intervalSeconds: int("interval_seconds").notNull(),
    nextRunAt: datetimeRequired("next_run_at"),
    lastRunAt: datetimeOptional("last_run_at"),
    consecutiveFailures: int("consecutive_failures").notNull().default(0),
    consecutiveSuccesses: int("consecutive_successes").notNull().default(0),
    lockedAt: datetimeOptional("locked_at"),
    selector: varchar("selector", { length: 512 }),
    expectedText: varchar("expected_text", { length: 512 }),
    checkMode: varchar("check_mode", { length: 32 }),
    viewport: varchar("viewport", { length: 16 }),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [
    index("monitor_due_idx").on(table.enabled, table.nextRunAt),
    index("monitor_site_idx").on(table.siteId),
    index("monitor_org_idx").on(table.organizationId),
  ],
);

export const monitorChecks = mysqlTable(
  "monitor_check",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    monitorId: id("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    startedAt: datetimeRequired("started_at"),
    completedAt: datetimeOptional("completed_at"),
    durationMs: int("duration_ms"),
    success: boolean("success").notNull().default(false),
    statusCode: int("status_code"),
    errorCode: varchar("error_code", { length: 64 }),
    errorMessage: varchar("error_message", { length: 1024 }),
    resolvedIp: varchar("resolved_ip", { length: 64 }),
    finalUrl: varchar("final_url", { length: 2048 }),
    pageTitle: varchar("page_title", { length: 512 }),
    sslValid: boolean("ssl_valid"),
    sslExpiresAt: datetimeOptional("ssl_expires_at"),
    trigger: varchar("trigger", { length: 16 }).notNull().default("schedule"),
    summary: json("summary"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("check_monitor_created_idx").on(table.monitorId, table.createdAt),
    index("check_site_created_idx").on(table.siteId, table.createdAt),
    index("check_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const visualSnapshots = mysqlTable(
  "visual_snapshot",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    monitorId: id("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    checkId: id("check_id").references(() => monitorChecks.id, {
      onDelete: "set null",
    }),
    viewport: varchar("viewport", { length: 16 }).notNull(),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    contentType: varchar("content_type", { length: 64 }).notNull(),
    byteSize: int("byte_size").notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),
    isBaseline: boolean("is_baseline").notNull().default(false),
    domSignals: json("dom_signals"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("snap_site_vp_idx").on(table.siteId, table.viewport, table.createdAt),
    index("snap_baseline_idx").on(table.monitorId, table.isBaseline),
    index("snap_org_idx").on(table.organizationId),
  ],
);

export const visualDiffs = mysqlTable(
  "visual_diff",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    monitorId: id("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    baselineSnapshotId: id("baseline_snapshot_id")
      .notNull()
      .references(() => visualSnapshots.id, { onDelete: "cascade" }),
    currentSnapshotId: id("current_snapshot_id")
      .notNull()
      .references(() => visualSnapshots.id, { onDelete: "cascade" }),
    diffStorageKey: varchar("diff_storage_key", { length: 512 }),
    differenceRatio: varchar("difference_ratio", { length: 16 }).notNull(),
    changedPixels: int("changed_pixels").notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),
    aboveThreshold: boolean("above_threshold").notNull(),
    metadata: json("metadata"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("diff_site_idx").on(table.siteId, table.createdAt)],
);

export const incidents = mysqlTable(
  "incident",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    monitorId: id("monitor_id").references(() => monitors.id, {
      onDelete: "set null",
    }),
    fingerprint: varchar("fingerprint", { length: 190 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    severity: varchar("severity", { length: 16 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("OPEN"),
    firstDetectedAt: datetimeRequired("first_detected_at"),
    lastDetectedAt: datetimeRequired("last_detected_at"),
    resolvedAt: datetimeOptional("resolved_at"),
    occurrenceCount: int("occurrence_count").notNull().default(1),
    aiAnalysis: json("ai_analysis"),
    metadata: json("metadata"),
    createdAt: datetimeRequired("created_at"),
    updatedAt: datetimeRequired("updated_at"),
  },
  (table) => [
    index("incident_org_status_idx").on(table.organizationId, table.status),
    index("incident_site_status_idx").on(table.siteId, table.status),
    index("incident_fingerprint_idx").on(
      table.organizationId,
      table.fingerprint,
      table.status,
    ),
  ],
);

export const incidentEvents = mysqlTable(
  "incident_event",
  {
    id: id().primaryKey(),
    incidentId: id("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    message: varchar("message", { length: 1024 }).notNull(),
    actorUserId: id("actor_user_id"),
    metadata: json("metadata"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("incident_event_idx").on(table.incidentId, table.createdAt)],
);

export const alertChannels = mysqlTable(
  "alert_channel",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 16 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    destination: varchar("destination", { length: 255 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("alert_channel_org_idx").on(table.organizationId)],
);

export const alertDeliveries = mysqlTable(
  "alert_delivery",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channelId: id("channel_id").references(() => alertChannels.id, {
      onDelete: "set null",
    }),
    incidentId: id("incident_id").references(() => incidents.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 32 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    errorMessage: varchar("error_message", { length: 512 }),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("alert_delivery_org_idx").on(table.organizationId)],
);

export const reports = mysqlTable(
  "report",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    siteId: id("site_id").references(() => sites.id, { onDelete: "cascade" }),
    periodStart: datetimeRequired("period_start"),
    periodEnd: datetimeRequired("period_end"),
    title: varchar("title", { length: 160 }).notNull(),
    metrics: json("metrics").notNull(),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("report_org_idx").on(table.organizationId, table.createdAt),
    uniqueIndex("report_site_period").on(
      table.organizationId,
      table.siteId,
      table.periodStart,
    ),
  ],
);

export const reportItems = mysqlTable(
  "report_item",
  {
    id: id().primaryKey(),
    reportId: id("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    detail: text("detail"),
  },
  (table) => [index("report_item_idx").on(table.reportId)],
);

export const auditLogs = mysqlTable(
  "audit_log",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id"),
    actorUserId: id("actor_user_id"),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 32 }),
    targetId: varchar("target_id", { length: 36 }),
    metadata: json("metadata"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("audit_org_idx").on(table.organizationId, table.createdAt),
    index("audit_actor_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const apiKeys = mysqlTable(
  "api_key",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    prefix: varchar("prefix", { length: 16 }).notNull(),
    secretHash: varchar("secret_hash", { length: 64 }).notNull().unique(),
    createdByUserId: id("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastUsedAt: datetimeOptional("last_used_at"),
    revokedAt: datetimeOptional("revoked_at"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("api_key_org_idx").on(table.organizationId)],
);

export const jobs = mysqlTable(
  "job",
  {
    id: id().primaryKey(),
    type: varchar("type", { length: 32 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    organizationId: id("organization_id"),
    siteId: id("site_id"),
    monitorId: id("monitor_id"),
    incidentId: id("incident_id"),
    payload: json("payload"),
    runAt: datetimeRequired("run_at"),
    claimedAt: datetimeOptional("claimed_at"),
    claimedBy: varchar("claimed_by", { length: 80 }),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    completedAt: datetimeOptional("completed_at"),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [
    index("job_claim_idx").on(table.status, table.runAt),
    index("job_monitor_status_idx").on(table.monitorId, table.status),
    index("job_org_idx").on(table.organizationId),
  ],
);

export const systemHeartbeats = mysqlTable("system_heartbeat", {
  name: varchar("name", { length: 32 }).primaryKey(),
  lastSeenAt: datetimeRequired("last_seen_at"),
  metadata: json("metadata"),
});

export const aiUsages = mysqlTable(
  "ai_usage",
  {
    id: id().primaryKey(),
    organizationId: id("organization_id"),
    incidentId: id("incident_id"),
    provider: varchar("provider", { length: 32 }).notNull(),
    model: varchar("model", { length: 64 }).notNull(),
    inputTokens: int("input_tokens"),
    outputTokens: int("output_tokens"),
    estimatedCostUsd: varchar("estimated_cost_usd", { length: 16 }),
    createdAt: datetimeRequired("created_at"),
  },
  (table) => [index("ai_usage_org_idx").on(table.organizationId, table.createdAt)],
);

export const rateLimits = mysqlTable(
  "rate_limit",
  {
    keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
    windowStart: datetimeRequired("window_start"),
    count: int("count").notNull().default(0),
    updatedAt: datetimeRequired("updated_at"),
  },
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  sessions: many(sessions),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  members: many(organizationMembers),
  sites: many(sites),
  subscription: one(subscriptions, {
    fields: [organizations.id],
    references: [subscriptions.organizationId],
  }),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  monitors: many(monitors),
  incidents: many(incidents),
}));

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  site: one(sites, {
    fields: [monitors.siteId],
    references: [sites.id],
  }),
  checks: many(monitorChecks),
}));

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type Monitor = typeof monitors.$inferSelect;
export type MonitorCheck = typeof monitorChecks.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type VisualSnapshot = typeof visualSnapshots.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type StatusPageSubscriber = typeof statusPageSubscribers.$inferSelect;

export const schema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  users,
  sessions,
  accounts,
  verifications,
  organizations,
  organizationMembers,
  organizationInvitations,
  statusPageSubscribers,
  subscriptions,
  billingEvents,
  sites,
  monitors,
  monitorChecks,
  visualSnapshots,
  visualDiffs,
  incidents,
  incidentEvents,
  alertChannels,
  alertDeliveries,
  reports,
  reportItems,
  auditLogs,
  apiKeys,
  jobs,
  systemHeartbeats,
  aiUsages,
  rateLimits,
};
