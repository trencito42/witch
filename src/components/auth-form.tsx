"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  actionForgotPassword,
  actionResetPassword,
  actionResendVerification,
  actionSignIn,
  actionSignUp,
  type AuthState,
} from "@/app/auth-actions";
import { Button, Input, Label } from "@/components/ui";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

const initial: AuthState = {};

export function AuthForm({
  mode,
  resetToken,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
  resetToken?: string;
}) {
  const action =
    mode === "signup"
      ? actionSignUp
      : mode === "login"
        ? actionSignIn
        : mode === "forgot"
          ? actionForgotPassword
          : actionResetPassword;
  const [state, formAction, pending] = useActionState(action, initial);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message?: string; error?: string } | null>(null);

  const handleResend = async (email: string) => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await actionResendVerification(email);
      setResendStatus(res);
    } catch {
      setResendStatus({ error: "Nu am putut retrimite emailul. Te rugăm să încerci din nou." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 sm:py-16 overflow-hidden">
      {/* Background subtle radial illumination */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(187,242,176,0.04)_0%,transparent_70%)] blur-2xl" />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="relative rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-1)]/70 p-7 sm:p-9 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Subtle top spectral edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--text)]">
              {mode === "login" && "Sign in to Witch"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
              {mode === "reset" && "Choose a new password"}
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-muted)]">
              {mode === "login" && "Continuous, quiet website monitoring beyond uptime."}
              {mode === "signup" && "Start watching what visitors actually see in minutes."}
              {mode === "forgot" && "We'll send a secure reset link to your email."}
              {mode === "reset" && "Must be at least 10 characters with a letter and a number."}
            </p>
          </div>

          {/* Form */}
          <form action={formAction} autoComplete="on" className="space-y-4">
            {mode === "reset" ? <input type="hidden" name="token" value={resetToken ?? ""} /> : null}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[13px] font-medium text-[var(--text-muted)]">
                  Your name
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="e.g. Alex Morgan"
                  className="bg-[var(--surface-0)]/60 border-[var(--border)] focus:border-[var(--accent)]/60"
                />
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-[var(--text-muted)]">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@agency.com"
                  className="bg-[var(--surface-0)]/60 border-[var(--border)] focus:border-[var(--accent)]/60"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium text-[var(--text-muted)]">
                    Password
                  </Label>
                  {mode === "login" && (
                    <Link
                      href="/forgot-password"
                      className="text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••••••"
                  className="bg-[var(--surface-0)]/60 border-[var(--border)] focus:border-[var(--accent)]/60"
                />
                {mode === "signup" && (
                  <p className="text-[11px] text-[var(--text-faint)]">
                    At least 10 characters with a letter and a number.
                  </p>
                )}
              </div>
            )}

            {state.error ? (
              <div className="p-3.5 rounded-xl bg-[var(--surface-0)] border border-[var(--critical)]/30 text-[12px] space-y-2.5">
                <div className="flex items-start gap-2.5 text-[var(--critical)] leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>

                {state.unverifiedEmail && (
                  <div className="pt-2.5 border-t border-[var(--border)] flex flex-col gap-1.5">
                    <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                      Nu ai primit emailul de confirmare sau a expirat link-ul?
                    </p>
                    <div>
                      <button
                        type="button"
                        disabled={resending}
                        onClick={() => handleResend(state.unverifiedEmail!)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] hover:underline disabled:opacity-50 min-h-[36px]"
                      >
                        {resending ? "Se trimite…" : "Retrimite emailul de verificare →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {resendStatus?.error ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--critical)]/10 border border-[var(--critical)]/25 text-[var(--critical)] text-[12px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resendStatus.error}</span>
              </div>
            ) : null}

            {resendStatus?.message || state.message ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--healthy)]/10 border border-[var(--healthy)]/25 text-[var(--healthy)] text-[12px] leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resendStatus?.message ?? state.message}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={pending}
              className="h-10 mt-2 font-semibold w-full"
            >
              {pending ? (
                "Please wait…"
              ) : (
                <>
                  {mode === "login" && "Sign in"}
                  {mode === "signup" && "Create account"}
                  {mode === "forgot" && "Send reset link"}
                  {mode === "reset" && "Update password"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]/60 text-center text-[12px] text-[var(--text-muted)]">
            {mode === "login" && (
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already using Witch?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            )}
            {mode === "forgot" && (
              <p>
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors underline underline-offset-4"
                >
                  Back to sign in
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Security / trust badge */}
        <p className="mt-6 text-center text-[11px] text-[var(--text-faint)] tracking-wider uppercase">
          Witch · monitoring beyond uptime
        </p>
      </div>
    </div>
  );
}
