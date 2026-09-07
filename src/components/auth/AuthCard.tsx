"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/auth/actions";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: string;
  required?: boolean;
};

export function AuthCard({
  title,
  intro,
  fields,
  submitLabel,
  action,
  hidden,
  footer,
}: {
  title: string;
  intro: string;
  fields: Field[];
  submitLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hidden?: Record<string, string>;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{intro}</p>

        <form action={formAction} className="mt-7 space-y-5">
          {hidden &&
            Object.entries(hidden).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}

          {fields.map((field) => {
            const isPassword = field.type === "password";
            const shown = visible[field.name];
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={isPassword && shown ? "text" : (field.type ?? "text")}
                    autoComplete={field.autoComplete}
                    required={field.required ?? true}
                    disabled={pending}
                    className={isPassword ? "pr-11" : undefined}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisible((current) => ({ ...current, [field.name]: !current[field.name] }))
                      }
                      className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="sr-only">{shown ? "Hide password" : "Show password"}</span>
                      {shown ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
                {field.hint && <p className="text-sm text-muted-foreground">{field.hint}</p>}
              </div>
            );
          })}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {submitLabel}
          </Button>
        </form>

        {state.error && (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}

        {state.message && (
          <p
            role="status"
            className="mt-5 flex items-start gap-2 rounded-xl bg-success-soft px-3.5 py-3 text-sm text-success"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}

        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        You do not need an account to use the browser-based tools.{" "}
        <Link href="/tools" className="font-medium text-primary underline-offset-4 hover:underline">
          Go to the tools
        </Link>
      </p>
    </div>
  );
}
