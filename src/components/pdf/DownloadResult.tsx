"use client";

import { useEffect, useRef } from "react";
import { Check, Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ResultStat = { label: string; value: string; highlight?: boolean };

export function DownloadResult({
  title = "Your PDF is ready",
  fileName,
  stats,
  note,
  downloadLabel = "Download PDF",
  restartLabel = "Start another task",
  onDownload,
  onRestart,
  onDelete,
  extraActions,
}: {
  title?: string;
  fileName: string;
  stats: ResultStat[];
  note?: string;
  downloadLabel?: string;
  restartLabel?: string;
  onDownload: () => void;
  onRestart: () => void;
  onDelete?: () => void;
  extraActions?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  // Bring the result into view. After a long job the person is often scrolled
  // somewhere else on the page, or the layout has shifted, and the finished
  // file is easy to miss.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    // Move keyboard focus too, so screen readers announce the result.
    panel.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={panel}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="animate-fade-in scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-lifted outline-none sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-0.5 break-all text-sm text-muted-foreground">{fileName}</p>
        </div>
      </div>

      {stats.length > 0 && (
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card px-4 py-3.5">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd
                className={
                  stat.highlight
                    ? "mt-1 font-display text-lg font-semibold text-success"
                    : "mt-1 font-display text-lg font-semibold text-foreground"
                }
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {note && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{note}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onDownload}>
          <Download aria-hidden="true" />
          {downloadLabel}
        </Button>
        {extraActions}
        <Button variant="secondary" size="lg" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {restartLabel}
        </Button>
        {onDelete && (
          <Button variant="ghost" size="lg" onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete file
          </Button>
        )}
      </div>
    </div>
  );
}
