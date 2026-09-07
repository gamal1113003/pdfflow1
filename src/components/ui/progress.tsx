import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indeterminate = false,
  label,
}: {
  value: number;
  className?: string;
  indeterminate?: boolean;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      {indeterminate ? (
        <div className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-y-0 -left-full w-full animate-shimmer bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      ) : (
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  );
}
