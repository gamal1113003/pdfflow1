import { Progress } from "@/components/ui/progress";

export function ProcessingProgress({
  label,
  value,
  detail,
}: {
  label: string;
  /** 0–100, or null for work whose length is unknown. */
  value: number | null;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-[1.05rem] font-medium text-foreground">{label}</p>
        {value !== null && (
          <span className="text-sm tabular-nums text-muted-foreground">{Math.round(value)}%</span>
        )}
      </div>
      <Progress
        className="mt-4"
        value={value ?? 0}
        indeterminate={value === null}
        label={label}
      />
      {detail && <p className="mt-3 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}
