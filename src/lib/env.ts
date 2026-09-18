import { z } from "zod";

function loadEnvFiles() {
  for (const file of [".env", ".env.local"]) {
    try {
      process.loadEnvFile?.(file);
    } catch {
      /* optional */
    }
  }
}

loadEnvFiles();

const isBuildTime = Boolean(process.env.NEXT_PHASE) || process.env.npm_lifecycle_event === "build";
const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

const optionalString = z
  .string()
  .optional()
  .transform((value) => {
    if (!value || value.trim() === "") return undefined;
    return value;
  });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3003),
  APP_URL: z
    .string()
    .default(
      process.env.NODE_ENV === "production"
        ? "https://witch.pw"
        : "http://localhost:3003",
    ),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      isBuildTime || isTest
        ? "mysql://witch:witch@127.0.0.1:3306/witch"
        : "",
    ),
  AUTH_SECRET: z
    .string()
    .min(16)
    .default(
      isBuildTime || isTest
        ? "build-time-auth-secret-not-used"
        : "",
    ),
  FIXTURE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  FIXTURE_PORT: z.coerce.number().default(3456),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  EMAIL_FROM: z.string().default("Witch <noreply@witch.pw>"),
  RESEND_API_KEY: optionalString,
  AI_PROVIDER: z.string().default("openai"),
  AI_API_KEY: optionalString,
  AI_MODEL: z.string().default("gpt-4.1-mini"),
  AI_BASE_URL: optionalString,
  AI_MAX_INPUT_CHARS: z.coerce.number().default(12_000),
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_PRICE_FREELANCER: optionalString,
  STRIPE_PRICE_AGENCY: optionalString,
  STRIPE_PRICE_AGENCY_PRO: optionalString,
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  STORAGE_PATH: z.string().default("./storage"),
  PLAYWRIGHT_HEADLESS: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
  PLAYWRIGHT_CHROMIUM_PATH: optionalString,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  HTTP_CONFIRMATION_FAILURES: z.coerce.number().default(2),
  HTTP_RECOVERY_SUCCESSES: z.coerce.number().default(2),
  CHECK_CONFIRMATION_DELAY_SECONDS: z.coerce.number().default(45),
  BROWSER_CHECK_TIMEOUT_MS: z.coerce.number().default(45_000),
  HTTP_CHECK_TIMEOUT_MS: z.coerce.number().default(15_000),
  MAX_REDIRECTS: z.coerce.number().default(5),
});

export type Env = z.infer<typeof schema>;

function readEnv(): Env {
  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_URL: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    FIXTURE_ENABLED: process.env.FIXTURE_ENABLED,
    FIXTURE_PORT: process.env.FIXTURE_PORT,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_MAX_INPUT_CHARS: process.env.AI_MAX_INPUT_CHARS,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_PRICE_FREELANCER: process.env.STRIPE_PRICE_FREELANCER,
    STRIPE_PRICE_AGENCY: process.env.STRIPE_PRICE_AGENCY,
    STRIPE_PRICE_AGENCY_PRO: process.env.STRIPE_PRICE_AGENCY_PRO,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    STORAGE_PATH: process.env.STORAGE_PATH,
    PLAYWRIGHT_HEADLESS: process.env.PLAYWRIGHT_HEADLESS,
    PLAYWRIGHT_CHROMIUM_PATH: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    LOG_LEVEL: process.env.LOG_LEVEL,
    HTTP_CONFIRMATION_FAILURES: process.env.HTTP_CONFIRMATION_FAILURES,
    HTTP_RECOVERY_SUCCESSES: process.env.HTTP_RECOVERY_SUCCESSES,
    CHECK_CONFIRMATION_DELAY_SECONDS:
      process.env.CHECK_CONFIRMATION_DELAY_SECONDS,
    BROWSER_CHECK_TIMEOUT_MS: process.env.BROWSER_CHECK_TIMEOUT_MS,
    HTTP_CHECK_TIMEOUT_MS: process.env.HTTP_CHECK_TIMEOUT_MS,
    MAX_REDIRECTS: process.env.MAX_REDIRECTS,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid environment: ${issue?.path.join(".")} ${issue?.message}`,
    );
  }

  return parsed.data;
}

let cached: Env | null = null;

export function getEnv(): Env {
  loadEnvFiles();
  if (!cached || !cached.DATABASE_URL) {
    cached = readEnv();
  }
  return cached;
}

export function appUrl(): string {
  const configured = (getEnv().NEXT_PUBLIC_APP_URL ?? getEnv().APP_URL).replace(
    /\/$/,
    "",
  );
  if (getEnv().NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(configured)) {
    return "https://witch.pw";
  }
  return configured;
}

export function emailEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.RESEND_API_KEY || env.SMTP_HOST);
}

export function aiEnabled(): boolean {
  return Boolean(getEnv().AI_API_KEY);
}

export function stripeEnabled(): boolean {
  return Boolean(getEnv().STRIPE_SECRET_KEY);
}
