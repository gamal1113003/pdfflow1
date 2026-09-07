"use client";

import { Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.language}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-1",
        className,
      )}
    >
      <Languages className="ml-1.5 size-4 text-muted-foreground" aria-hidden="true" />
      {LANGUAGES.map((entry) => {
        const active = language === entry.code;
        return (
          <button
            key={entry.code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={entry.label}
            title={entry.label}
            onClick={() => setLanguage(entry.code)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-primary-soft text-primary",
            )}
          >
            {entry.short}
          </button>
        );
      })}
    </div>
  );
}
