"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ToolCard } from "@/components/tools/ToolCard";
import { searchToolsWith, type ToolCategory } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { translateTool } from "@/lib/i18n/toolStrings";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const VALID_CATEGORIES = new Set([
  "convert-from-pdf",
  "convert-to-pdf",
  "compress",
  "organize",
  "edit",
  "security",
  "image",
]);

export function ToolsExplorer({ initialCategory = "all" }: { initialCategory?: ToolCategory | "all" }) {
  const [category, setCategory] = useState<ToolCategory | "all">(initialCategory);
  // Read on the client rather than the server, so the page can be exported as
  // static HTML and still respond to /tools?category=organize.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const { language, t } = useLanguage();

  // The header links point at /tools?category=organize and similar. Moving
  // between them is a navigation within the same route, so this component is
  // not remounted and the initial state would otherwise stick on whichever
  // category was opened first.
  useEffect(() => {
    const requested = searchParams.get("category");
    const valid = requested && VALID_CATEGORIES.has(requested);
    setCategory(valid ? (requested as ToolCategory) : initialCategory);
  }, [searchParams, initialCategory]);

  // Matches the translated name and description as well as the English ones,
  // so "объединить" finds Merge PDF while "merge" still does too.
  const results = useMemo(
    () =>
      searchToolsWith(query, category, (tool) => {
        const copy = translateTool(language, tool.slug, tool);
        return `${copy.name} ${copy.description} ${copy.lede}`;
      }),
    [query, category, language],
  );

  const categories = [
    { id: "all" as const, label: t.toolsPage.all },
    { id: "convert-from-pdf" as const, label: t.toolsPage.convertFrom },
    { id: "convert-to-pdf" as const, label: t.toolsPage.convertTo },
    { id: "compress" as const, label: t.toolsPage.compress },
    { id: "organize" as const, label: t.toolsPage.organize },
    { id: "edit" as const, label: t.toolsPage.edit },
    { id: "security" as const, label: t.toolsPage.security },
    { id: "image" as const, label: t.toolsPage.image },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={t.toolsPage.categories}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {categories.map((entry) => {
            const active = category === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(entry.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="tool-search" className="sr-only">
            {t.toolsPage.search}
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.toolsPage.search}
            className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-10 text-[0.95rem] shadow-subtle transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="sr-only">{t.toolsPage.clearSearch}</span>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {fill(results.length === 1 ? t.toolsPage.resultOne : t.toolsPage.resultMany, {
          count: results.length,
        })}
        {query && ` — ${t.toolsPage.matching} “${query}”`}
      </p>

      {/* A minimum height stops the page jumping as the grid renders: without
          it the document is short for a moment and then abruptly tall, which
          shifts the scroll position. */}
      <div className="min-h-[70vh]">
      {results.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
          <p className="font-display text-lg font-medium">{t.toolsPage.emptyTitle}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t.toolsPage.emptyBody}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.toolsPage.showAll}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
