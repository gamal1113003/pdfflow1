"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/tools/ToolIcon";
import type { Tool } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { translateTool } from "@/lib/i18n/toolStrings";
import { pathFor } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Two shapes for the same card.
 *
 * `compact` puts the icon beside the name in a single row, which fits far more
 * tools on screen at once — the right choice when showing all of them. The
 * full card keeps the description and suits a short, curated list.
 */
export function ToolCard({
  tool,
  compact = false,
  className,
}: {
  tool: Tool;
  compact?: boolean;
  className?: string;
}) {
  const { language, t } = useLanguage();
  const copy = translateTool(language, tool.slug, tool);
  const href = pathFor(language, `/${tool.slug}`);

  if (compact) {
    return (
      <Link
        href={href}
        title={copy.description}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ToolIcon name={tool.icon} className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{copy.name}</span>
          {!tool.runsInBrowser && (
            <span className="block text-[0.7rem] text-muted-foreground">
              {t.toolPage.server}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-subtle transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <ToolIcon name={tool.icon} className="size-5" />
      </span>

      <h3 className="mt-4 font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
        {copy.name}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {copy.description}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {t.toolPage.openTool}
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>

      {!tool.runsInBrowser && (
        <span className="absolute right-5 top-5 rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          {t.toolPage.server}
        </span>
      )}
    </Link>
  );
}
