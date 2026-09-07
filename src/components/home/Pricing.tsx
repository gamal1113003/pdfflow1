"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { plans } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Pricing({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yearly && "font-medium text-foreground")}>Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Show yearly prices" />
        <span className={cn("text-sm", yearly && "font-medium text-foreground")}>
          Yearly
          <span className="ml-1.5 text-primary">save 2 months</span>
        </span>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = yearly ? plan.yearly / 12 : plan.monthly;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7",
                plan.highlighted
                  ? "border-primary shadow-lifted lg:-my-3 lg:py-10"
                  : "border-border shadow-subtle",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}

              <h3 className="font-display text-lg font-semibold tracking-tight">{plan.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold tracking-[-0.03em]">
                  ${price % 1 === 0 ? price : price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">{plan.unit}</span>
              </p>
              {yearly && plan.monthly > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Billed ${plan.yearly} per year
                </p>
              )}

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                <Link href={plan.id === "business" ? "/contact" : "/tools"}>{plan.cta}</Link>
              </Button>
            </div>
          );
        })}
      </div>

      {!compact && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices in USD. Cancel any time — paid plans stop at the end of the billing period.
        </p>
      )}
    </div>
  );
}
