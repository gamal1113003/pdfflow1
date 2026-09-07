"use client";

import { FolderOpen, MousePointerClick, Download } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { title: t.home.step1Title, body: t.home.step1Body, Icon: MousePointerClick },
    { title: t.home.step2Title, body: t.home.step2Body, Icon: FolderOpen },
    { title: t.home.step3Title, body: t.home.step3Body, Icon: Download },
  ];

  return (
    <section className="border-b border-border py-16 sm:py-20" aria-labelledby="how-it-works">
      <div className="container">
        <h2 id="how-it-works" className="font-display text-display-sm font-semibold">
          {t.home.howTitle}
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted-foreground">
          {t.home.howSubtitle}
        </p>

        <ol className="relative mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          <div
            aria-hidden="true"
            className="flow-track absolute left-[16%] right-[16%] top-6 hidden h-px sm:block"
          />
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary shadow-subtle">
                  <step.Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight sm:mt-5">
                  <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                  {step.title}
                </h3>
              </div>
              <p className="mt-2 max-w-[38ch] leading-relaxed text-muted-foreground sm:mt-3">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
