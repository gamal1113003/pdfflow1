"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/tools/ToolIcon";
import type { Tool } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { translateTool } from "@/lib/i18n/toolStrings";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const { language, t } = useLanguage();
  const copy = translateTool(language, tool.slug, tool);

  return (
    <Link
      href={`/${tool.slug}`}
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
