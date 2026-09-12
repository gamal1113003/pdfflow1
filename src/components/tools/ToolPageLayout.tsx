"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { toolJsonLd } from "@/lib/seo";
import { getTool, tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Language } from "@/lib/i18n/dictionaries";
import { pathFor } from "@/lib/i18n/locale";
import { translateTool } from "@/lib/i18n/toolStrings";
import { fill } from "@/lib/i18n/dictionaries";

export function ToolPageLayout({ slug, locale }: { slug: string; locale?: Language }) {
  const context = useLanguage();
  const language = locale ?? context.language;
  const t = context.t;
  const tool = getTool(slug);
  const copy = translateTool(language, tool.slug, tool);
  const related = tools
    .filter((item) => item.slug !== tool.slug)
    .filter((item) => item.categories.some((category) => tool.categories.includes(category)))
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(slug, language)) }}
      />

      <div className="container pb-20 pt-8 sm:pt-12">
        {/* One obvious way back, rather than a breadcrumb. People arrive on a
            tool page, use it, and want the list again — the intermediate steps
            of a breadcrumb are not what they are reaching for. */}
        <div className="mb-8">
          <Link
            href={pathFor(language, "/tools")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t.nav.browseAll}
          </Link>
        </div>

        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-display-md font-semibold text-foreground">{copy.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{copy.lede}</p>
        </header>

        <div className="mx-auto mt-10 max-w-4xl">
          <ToolWorkspace tool={tool} />
        </div>

      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-card py-16" aria-labelledby="related-tools">
          <div className="container">
            <h2 id="related-tools" className="font-display text-display-sm font-semibold">
              {t.toolPage.relatedTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {fill(t.toolPage.relatedSubtitle, { name: copy.name })}
            </p>
            <div className="mt-8">
              <ToolGrid tools={related} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
