"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { pathFor } from "@/lib/i18n/locale";
import { fill } from "@/lib/i18n/dictionaries";

export default function HomePage() {
  const { language, t } = useLanguage();

  return (
    <>
      {/* The headline and the tools, nothing between them. An upload box here
          only asks a question the tool pages ask anyway. */}
      <section className="border-b border-border bg-card py-14 sm:py-20">
        <div className="container">
          <h1 className="max-w-[18ch] font-display text-display-lg font-semibold text-foreground">
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-muted-foreground">
            {t.home.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby="all-tools">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="all-tools" className="font-display text-display-sm font-semibold">
                {t.home.popularTitle}
              </h2>
              <p className="mt-2 max-w-[56ch] text-muted-foreground">
                {t.home.popularSubtitle}
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href={pathFor(language, "/tools")}>
                {fill(t.home.allToolsCta, { count: tools.length })}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-10">
            <ToolGrid tools={tools} />
          </div>
        </div>
      </section>

      <HowItWorks />
    </>
  );
}
