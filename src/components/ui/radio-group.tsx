"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-3", className)} {...props} />
));
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "grid size-5 shrink-0 place-items-center rounded-full border-2 border-input text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 data-[state=checked]:border-primary",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary" />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = "RadioGroupItem";

/** A radio rendered as a selectable card, used for tool settings. */
export function RadioCard({
  value,
  id,
  title,
  hint,
  checked,
}: {
  value: string;
  id: string;
  title: string;
  hint: string;
  checked?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked
          ? "border-primary bg-primary-soft/60"
          : "border-border bg-card hover:border-foreground/20",
      )}
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <span className="space-y-1">
        <span className="block text-[0.95rem] font-medium text-foreground">{title}</span>
        <span className="block text-sm leading-relaxed text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
