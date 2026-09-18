"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  actionForgotPassword,
  actionResetPassword,
  actionSignIn,
  actionSignUp,
  type AuthState,
} from "@/app/auth-actions";
import { Button, Input, Label } from "@/components/ui";

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

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-16">
      <h1 className="mb-8 text-[22px] font-medium tracking-tight">
        {mode === "login" && "Sign in"}
        {mode === "signup" && "Create an account"}
        {mode === "forgot" && "Reset password"}
        {mode === "reset" && "Choose a new password"}
      </h1>
      <form action={formAction} autoComplete="on" className="space-y-4">
        {mode === "reset" ? <input type="hidden" name="token" value={resetToken ?? ""} /> : null}
        {mode === "signup" && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
        )}
        {mode !== "reset" && (
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
        )}
        {mode !== "forgot" && (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            {mode === "signup" && (
              <p className="mt-1.5 text-[12px] text-[var(--text-faint)]">
                At least 10 characters, including a letter and a number.
              </p>
            )}
          </div>
        )}
        {state.error ? <p className="text-[13px] text-[var(--critical)]">{state.error}</p> : null}
        {state.message ? <p className="text-[13px] text-[var(--healthy)]">{state.message}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Continue"}
        </Button>
      </form>
      <div className="mt-6 space-y-2 text-[13px] text-[var(--text-muted)]">
        {mode === "login" && (
          <>
            <div>
              No account?{" "}
              <Link href="/signup" className="prose-link text-[var(--text)]">
                Create one
              </Link>
            </div>
            <Link href="/forgot-password" className="prose-link">
              Forgot password
            </Link>
          </>
        )}
        {mode === "signup" && (
          <div>
            Already using Witch?{" "}
            <Link href="/login" className="prose-link text-[var(--text)]">
              Sign in
            </Link>
          </div>
        )}
        {mode === "forgot" && (
          <Link href="/login" className="prose-link">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
