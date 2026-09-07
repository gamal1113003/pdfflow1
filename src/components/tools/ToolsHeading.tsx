"use client";

import { fill } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function ToolsHeading({ count }: { count: number }) {
  const { t } = useLanguage();
  return (
    <header className="max-w-2xl">
      <h1 className="font-display text-display-md font-semibold">{t.toolsPage.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {fill(t.toolsPage.subtitle, { count })}
      </p>
    </header>
  );
}
