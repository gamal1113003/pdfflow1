"use client";

import { HowItWorks } from "@/components/home/HowItWorks";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Straight to the tools. Nothing above them to read past. */}
      <section className="py-12 sm:py-16" aria-labelledby="all-tools">
        <div className="container">
          <h1 id="all-tools" className="font-display text-display-md font-semibold">
            {t.home.popularTitle}
          </h1>
          <p className="mt-3 max-w-[56ch] text-muted-foreground">{t.home.popularSubtitle}</p>

          <div className="mt-10">
            <ToolGrid tools={tools} />
          </div>
        </div>
      </section>

      <HowItWorks />
    </>
  );
}
