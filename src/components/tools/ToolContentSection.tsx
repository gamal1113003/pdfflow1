"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toolContent } from "@/lib/i18n/toolContent";
import type { Language } from "@/lib/i18n/dictionaries";

/**
 * The written part of a tool page.
 *
 * Search engines rank pages that explain something. An upload box on its own
 * gives them nothing to work with, however well the tool behind it works.
 *
 * The FAQ is also emitted as structured data, which is what produces the
 * expandable question results in Google and Yandex.
 */
export function ToolContentSection({
  slug,
  language,
}: {
  slug: string;
  language: Language;
}) {
  const content = toolContent(language, slug);
  if (!content) return null;

  const faqJsonLd = content.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: language,
        mainEntity: content.faq.map((entry) => ({
          "@type": "Question",
          name: entry.q,
          acceptedAnswer: { "@type": "Answer", text: entry.a },
        })),
      }
    : null;

  return (
    <section className="border-t border-border py-16 sm:py-20">
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="container grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <div className="prose-page">
            {content.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          {content.steps && content.steps.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-display-sm font-semibold">
                {content.stepsHeading}
              </h2>
              <ol className="mt-6 list-none space-y-6 p-0">
                {content.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-[1.05rem] font-semibold">{step.title}</h3>
                      <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {content.faq && content.faq.length > 0 && (
          <div>
            <h2 className="font-display text-display-sm font-semibold">{content.faqHeading}</h2>
            <Accordion type="single" collapsible className="mt-6 border-t border-border">
              {content.faq.map((entry, index) => (
                <AccordionItem key={entry.q} value={`faq-${index}`}>
                  <AccordionTrigger>{entry.q}</AccordionTrigger>
                  <AccordionContent>{entry.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </section>
  );
}
