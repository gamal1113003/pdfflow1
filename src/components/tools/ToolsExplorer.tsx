"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ToolCard } from "@/components/tools/ToolCard";
import { searchTools, TOOL_CATEGORIES, type ToolCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolsExplorer({ initialCategory = "all" }: { initialCategory?: ToolCategory | "all" }) {
  const [category, setCategory] = useState<ToolCategory | "all">(initialCategory);
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchTools(query, category), [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Tool categories"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {TOOL_CATEGORIES.map((entry) => {
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
            Search PDF tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search PDF tools..."
            className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-10 text-[0.95rem] shadow-subtle transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="sr-only">Clear search</span>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "tool" : "tools"}
        {query && ` matching “${query}”`}
      </p>

      {results.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
          <p className="font-display text-lg font-medium">No tool matches that search</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Try a different word, or clear the filters to see everything.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Show all tools
          </button>
        </div>
      )}
    </div>
  );
}
