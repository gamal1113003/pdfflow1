"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/lib/auth/actions";

export function ProfileForm({
  email,
  fullName,
  plan,
}: {
  email: string;
  fullName: string;
  plan: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, {});

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-sm text-muted-foreground">
          Changing your email is not available yet — contact us and we will do it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Your name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          autoComplete="name"
          disabled={pending}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <span className="text-sm font-medium">Current plan</span>
        <div className="flex items-center gap-3">
          <Badge variant={plan === "free" ? "neutral" : "primary"}>{plan}</Badge>
          <Link
            href="/pricing"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Change
          </Link>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Save changes
      </Button>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}
    </form>
  );
}
