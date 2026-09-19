"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/auth";
import { emailSchema, nameSchema, passwordSchema } from "@/validation";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { persistDefaultOrganization } from "@/server/tenancy";
import { writeAudit } from "@/server/audit";
import { clientIpFromHeaders } from "@/lib/client-ip";

export type AuthState = {
  error?: string;
  message?: string;
  unverifiedEmail?: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function clientIp() {
  return clientIpFromHeaders(await headers());
}

function authError(error: unknown): AuthState {
  if (error instanceof RateLimitError) return { error: error.message };
  if (error instanceof ZodError) {
    return { error: error.issues[0]?.message ?? "Invalid input." };
  }
  if (error instanceof APIError) return { error: error.message || "Request failed." };
  if (error instanceof Error) return { error: error.message };
  return { error: "Request failed." };
}

export async function actionSignUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  try {
    const name = nameSchema.parse(formString(formData, "name"));
    const email = emailSchema.parse(formString(formData, "email")).toLowerCase();
    const password = passwordSchema.parse(formString(formData, "password"));
    await enforceRateLimit({ key: `signup:ip:${ip}`, limit: 8, windowSeconds: 3600 });
    await enforceRateLimit({ key: `signup:email:${email}`, limit: 5, windowSeconds: 3600 });
    await auth.api.signUpEmail({
      body: { name, email, password, callbackURL: "/onboarding" },
      headers: await headers(),
    });
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) await persistDefaultOrganization(session.user.id);
  } catch (error) {
    return authError(error);
  }
  redirect("/onboarding");
}

export async function actionSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  let parsedEmail = "";
  try {
    parsedEmail = emailSchema.parse(formString(formData, "email")).toLowerCase();
    const email = parsedEmail;
    const password = formString(formData, "password");
    await enforceRateLimit({ key: `login:ip:${ip}`, limit: 20, windowSeconds: 600 });
    await enforceRateLimit({ key: `login:email:${email}`, limit: 10, windowSeconds: 600 });
    await auth.api.signInEmail({
      body: { email, password, callbackURL: "/overview" },
      headers: await headers(),
    });
    await writeAudit({ action: "login", metadata: { ip } });
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) await persistDefaultOrganization(session.user.id);
  } catch (error) {
    const isUnverified =
      (error instanceof APIError &&
        (error.message?.toLowerCase().includes("verified") ||
          (error as { body?: { code?: string } }).body?.code === "EMAIL_NOT_VERIFIED" ||
          error.status === 403)) ||
      (error instanceof Error && error.message.toLowerCase().includes("verified"));

    if (isUnverified) {
      return {
        error: "Adresa de email nu a fost încă verificată.",
        unverifiedEmail: parsedEmail,
      };
    }

    return authError(error);
  }
  redirect("/overview");
}

export async function actionResendVerification(emailRaw: string): Promise<AuthState> {
  const ip = await clientIp();
  try {
    const email = emailSchema.parse(emailRaw).toLowerCase();
    await enforceRateLimit({ key: `resend-verify:ip:${ip}`, limit: 5, windowSeconds: 600 });
    await enforceRateLimit({ key: `resend-verify:email:${email}`, limit: 3, windowSeconds: 600 });
    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: "/overview",
      },
      headers: await headers(),
    });
    return {
      message: `Am trimis un nou link de verificare la ${email}. Te rugăm să verifici căsuța de email (inclusiv folderul Spam).`,
      unverifiedEmail: email,
    };
  } catch (error) {
    return authError(error);
  }
}

export async function actionForgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  try {
    const email = emailSchema.parse(formString(formData, "email")).toLowerCase();
    await enforceRateLimit({ key: `forgot:ip:${ip}`, limit: 8, windowSeconds: 3600 });
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch (error) {
    return authError(error);
  }
  return {
    message: "If that account exists, a reset email was sent when mail is configured.",
  };
}

export async function actionResetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    const token = formString(formData, "token");
    const password = passwordSchema.parse(formString(formData, "password"));
    if (!token) return { error: "Reset token is missing." };
    await auth.api.resetPassword({
      body: { token, newPassword: password },
      headers: await headers(),
    });
  } catch (error) {
    return authError(error);
  }
  redirect("/login");
}
