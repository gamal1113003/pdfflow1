"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Consistent panel around the settings of every tool. */
export function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function WidgetStack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
