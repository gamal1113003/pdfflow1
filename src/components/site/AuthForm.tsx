"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotice } from "@/components/pdf/Notices";
import {
  AuthUnavailableError,
  checkEmail,
  checkPassword,
  isAuthConfigured,
  signIn,
  signUp,
} from "@/lib/services/authService";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(!isAuthConfigured());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const emailProblem = checkEmail(email);
    if (emailProblem) {
      setError(emailProblem);
      return;
    }
    if (isSignUp) {
      const passwordProblem = checkPassword(password);
      if (passwordProblem) {
        setError(passwordProblem);
        return;
      }
      if (!name.trim()) {
        setError("Enter your name.");
        return;
      }
    } else if (!password) {
      setError("Enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) await signUp({ email, password, name });
      else await signIn({ email, password });
      // A connected backend sets the session cookie; a full reload picks it up.
      window.location.assign("/tools");
    } catch (cause) {
      if (cause instanceof AuthUnavailableError) setUnavailable(true);
      else setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isSignUp
            ? "An account raises your limits and unlocks the server-side tools. The browser tools stay free without one."
            : "Sign in to reach your plan limits and team workspace."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete={isSignUp ? "email" : "username"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              {!isSignUp && (
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {isSignUp && (
              <p className="text-sm text-muted-foreground">
                At least 10 characters. Length matters more than symbols.
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        {error && (
          <div className="mt-5">
            <ErrorNotice title="Could not continue" message={error} />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "No account yet? "}
          <Link
            href={isSignUp ? "/login" : "/signup"}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>

      {unavailable && (
        <div className="mt-5 flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ServerCog className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h2 className="font-display text-[1.05rem] font-semibold tracking-tight">
              Accounts are not switched on
            </h2>
            <p className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
              Sign-in needs a server that can store accounts and issue sessions, and this build has
              none connected — so this form will not sign you in. It is not pretending to.
            </p>
            <p className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
              Every browser-based tool works right now without an account:{" "}
              <Link href="/tools" className="font-medium text-primary hover:underline">
                go to the tools
              </Link>
              . To enable accounts, see{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">lib/services/authService.ts</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
