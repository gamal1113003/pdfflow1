"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { usePendingFile } from "@/components/pdf/PendingFileProvider";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { Button } from "@/components/ui/button";
import { getTool } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { translateTool } from "@/lib/i18n/toolStrings";
import { formatBytes } from "@/lib/utils";

const NEXT_STEPS = ["compress-pdf", "split-pdf", "edit-pdf", "watermark-pdf", "sign-pdf", "pdf-to-jpg"];

export function Hero() {
  const { pendingFile, setPendingFile } = usePendingFile();
  const { language, t } = useLanguage();
  const [chooserOpen, setChooserOpen] = useState(false);

  return (
    <section className="border-b border-border bg-card">
      <div className="container grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <h1 className="max-w-[15ch] font-display text-display-lg font-semibold text-foreground">
            {t.home.heroTitle}
          </h1>
          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-muted-foreground">
            {t.home.heroSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/tools">
                {t.home.exploreTools}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/compress-pdf">{t.home.compressCta}</Link>
            </Button>
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            {t.home.privacyLine}
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-3 -z-10 rounded-[2rem] bg-primary-soft/70 lg:-inset-5"
          />
          {chooserOpen && pendingFile ? (
            <div className="animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-lifted sm:p-8">
              <p className="text-sm text-muted-foreground">{t.home.readyLabel}</p>
              <h2 className="mt-1 truncate font-display text-xl font-semibold tracking-tight">
                {pendingFile.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBytes(pendingFile.size)} · {t.home.whatNext}
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {NEXT_STEPS.map((slug) => {
                  const tool = getTool(slug);
                  return (
                    <Link
                      key={slug}
                      href={`/${slug}`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/50 hover:bg-primary-soft/40"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <ToolIcon name={tool.icon} className="size-4" />
                      </span>
                      <span className="truncate text-sm font-medium">{translateTool(language, slug, tool).name}</span>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setChooserOpen(false);
                }}
                className="mt-5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t.home.differentFile}
              </button>
            </div>
          ) : (
            <>
              <FileUploader
                extensions={["pdf"]}
                title={t.home.dropTitle}
                hint={t.home.dropHint}
                buttonLabel={t.home.dropButton}
                note={t.home.dropNote}
                onFiles={(files) => {
                  setPendingFile(files[0]);
                  setChooserOpen(true);
                }}
              />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t.home.securedLine}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
