"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { switchLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Links rather than buttons. Each language now has its own URL, so switching
 * is a navigation — which also means the choice can be shared and bookmarked,
 * and a search engine can follow it.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const { language, t } = useLanguage();

  return (
    <nav
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
          <Link
            key={entry.code}
            href={switchLocale(pathname, entry.code)}
            hrefLang={entry.code}
            aria-current={active ? "true" : undefined}
            title={entry.label}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-primary-soft text-primary",
            )}
          >
            {entry.short}
          </Link>
        );
      })}
    </nav>
  );
}
