import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { appUrl, emailEnabled, getEnv } from "@/lib/env";
import { trustedOrigins } from "@/lib/origins";
import { logger } from "@/lib/logger";
import { passwordSchema } from "@/validation";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "@/emails/send";
import { createPersonalOrganization } from "@/server/organizations";

export const auth = betterAuth({
  appName: "Witch",
  baseURL: appUrl(),
  secret: getEnv().AUTH_SECRET,
  trustedOrigins: trustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  user: {
    additionalFields: {
      lastLoginAt: { type: "date", required: false, input: false },
      isAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: emailEnabled(),
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: emailEnabled(),
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  advanced: {
    useSecureCookies: getEnv().NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: getEnv().NODE_ENV === "production",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await createPersonalOrganization({
              userId: user.id,
              name: user.name,
              email: user.email,
            });
            await sendWelcomeEmail(user.email, user.name);
          } catch (error) {
            logger.error({ err: error, userId: user.id }, "post-signup setup failed");
            throw error;
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await db
            .update(users)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, session.userId));
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export function assertPasswordStrength(password: string) {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid password");
  }
}
