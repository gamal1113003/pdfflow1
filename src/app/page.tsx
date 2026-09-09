"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fill } from "@/lib/i18n/dictionaries";

export default function HomePage() {
  const { t } = useLanguage();
  return (
    <>
      <Hero />

      <section className="py-16 sm:py-20" aria-labelledby="all-tools">
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
              <Link href="/tools">
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
