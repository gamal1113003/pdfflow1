import { cn } from "@/lib/utils";

export function NativeSelect({
  id,
  value,
  options,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-card px-3 text-[0.95rem] text-foreground shadow-subtle transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
