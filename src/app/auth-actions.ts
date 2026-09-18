"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/auth";
import { emailSchema, nameSchema, passwordSchema } from "@/validation";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { writeAudit } from "@/server/audit";

export type AuthState = { error?: string; message?: string };

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
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
  try {
    const email = emailSchema.parse(formString(formData, "email")).toLowerCase();
    const password = formString(formData, "password");
    await enforceRateLimit({ key: `login:ip:${ip}`, limit: 20, windowSeconds: 600 });
    await enforceRateLimit({ key: `login:email:${email}`, limit: 10, windowSeconds: 600 });
    await auth.api.signInEmail({
      body: { email, password, callbackURL: "/overview" },
      headers: await headers(),
    });
    await writeAudit({ action: "login", metadata: { ip } });
  } catch (error) {
    return authError(error);
  }
  redirect("/overview");
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
