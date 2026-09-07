import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorNotice({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive-soft p-5 sm:flex-row sm:items-start",
        className,
      )}
    >
      <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="font-medium text-destructive">{title}</p>
        <p className="text-sm leading-relaxed text-destructive/85">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function InfoNotice({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-2xl border border-border bg-muted/60 p-5", className)}>
      <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <div className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "Your PDF will appear here",
  message = "Upload a document to get started.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
      <div className="space-y-1.5">
        <p className="font-display text-lg font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
