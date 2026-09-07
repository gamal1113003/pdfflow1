"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { Button } from "@/components/ui/button";

/** Single-page viewer with paging, used for previews and signature placement. */
export function PDFViewer({
  bytes,
  pageNumber,
  onPageChange,
  maxEdge = 900,
  overlay,
  className,
}: {
  bytes: Uint8Array;
  pageNumber: number;
  onPageChange?: (page: number) => void;
  maxEdge?: number;
  overlay?: React.ReactNode;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    (async () => {
      try {
        const doc = await openDocument(bytes);
        if (cancelled) {
          await doc.destroy();
          return;
        }
        setPageCount(doc.numPages);
        const target = Math.min(Math.max(pageNumber, 1), doc.numPages);
        const rendered = await renderPage(doc, target, { maxEdge, quality: 0.92 });
        if (!cancelled) setSrc(rendered.dataUrl);
        await doc.destroy();
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "This page could not be displayed.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bytes, pageNumber, maxEdge]);

  if (error) {
    return (
      <p role="alert" className="rounded-2xl bg-destructive-soft p-5 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Page ${pageNumber}`} className="block w-full" />
        ) : (
          <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
        )}
        {overlay}
      </div>

      {pageCount > 1 && onPageChange && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => onPageChange(pageNumber - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            Page {pageNumber} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pageNumber >= pageCount}
            onClick={() => onPageChange(pageNumber + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
