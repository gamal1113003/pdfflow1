"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert, SquareSlash, Trash2, Undo2 } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { redactPdf, type RedactBox } from "@/lib/pdf/redact";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, uid, withSuffix } from "@/lib/utils";

type Drag = { start: { x: number; y: number }; id: string };

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function RedactWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [pageNumber, setPageNumber] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    if (!pdf) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await openDocument(pdf.bytes);
        const target = Math.min(Math.max(pageNumber, 1), doc.numPages);
        const rendered = await renderPage(doc, target, { maxEdge: 1100, quality: 0.92 });
        if (!cancelled) setPreview(rendered.dataUrl);
        await doc.destroy();
      } catch {
        if (!cancelled) setError("This page could not be displayed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, setError]);

  const pointOf = useCallback((event: { clientX: number; clientY: number }) => {
    const surface = surfaceRef.current;
    if (!surface) return { x: 0, y: 0 };
    const bounds = surface.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height),
    };
  }, []);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const active = drag.current;
      if (!active) return;
      const point = pointOf(event);
      setBoxes((current) =>
        current.map((box) =>
          box.id === active.id
            ? {
                ...box,
                x: Math.min(active.start.x, point.x),
                y: Math.min(active.start.y, point.y),
                width: Math.abs(point.x - active.start.x),
                height: Math.abs(point.y - active.start.y),
              }
            : box,
        ),
      );
    }

    function onUp() {
      const active = drag.current;
      drag.current = null;
      if (!active) return;
      // Discard an accidental click rather than leaving an invisible box.
      setBoxes((current) =>
        current.filter((box) => box.id !== active.id || (box.width > 0.005 && box.height > 0.005)),
      );
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pointOf]);

  function startBox(event: React.PointerEvent) {
    const start = pointOf(event);
    const id = uid();
    setBoxes((current) => [
      ...current,
      { id, page: pageNumber, x: start.x, y: start.y, width: 0, height: 0 },
    ]);
    drag.current = { start, id };
  }

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setResult(
        await redactPdf(pdf.bytes, boxes, {
          onProgress: (done, total) => setProgress({ done, total }),
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The document could not be redacted.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    setBoxes([]);
    setPageNumber(1);
    clear();
  }

  const onThisPage = boxes.filter((box) => box.page === pageNumber);

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "redacted");
    return (
      <DownloadResult
        title="Your redacted PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Areas removed", value: String(boxes.length) },
          { label: "Pages", value: String(pdf.pageCount) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="The content under the black areas is gone, not covered — each page was rebuilt as an image. The document can no longer be searched or copied, which is the cost of removing it properly. Metadata has been cleared too."
        downloadLabel="Download redacted PDF"
        restartLabel="Redact another document"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader
          extensions={ACCEPTED_INPUT}
          disabled={loading}
          busy={loading}
          onFiles={load}
        />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={pdf.pageCount}
            onRemove={progress ? undefined : reset}
          />

          <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-5">
            <ShieldAlert
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="font-medium text-foreground">This removes the content, not just hides it</p>
              <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                Each page is rebuilt as an image with the black areas painted on, so what was
                underneath no longer exists in the file. The result cannot be searched or copied,
                and it is larger. A tool that only drew boxes would leave the text recoverable by
                anyone who selected it.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={boxes.length === 0}
              onClick={() => setBoxes((current) => current.slice(0, -1))}
            >
              <Undo2 aria-hidden="true" />
              Undo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={onThisPage.length === 0}
              onClick={() => setBoxes((current) => current.filter((box) => box.page !== pageNumber))}
            >
              <Trash2 aria-hidden="true" />
              Clear this page
            </Button>
            <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
              {onThisPage.length} on this page · {boxes.length} in total
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
            <div
              ref={surfaceRef}
              onPointerDown={startBox}
              className="relative mx-auto w-full max-w-3xl cursor-crosshair select-none overflow-hidden rounded-xl bg-card shadow-card"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={`Page ${pageNumber}`}
                  draggable={false}
                  className="pointer-events-none block w-full"
                />
              ) : (
                <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
              )}

              {onThisPage.map((box) => (
                <div
                  key={box.id}
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                  }}
                  className="absolute bg-black"
                />
              ))}
            </div>

            {pdf.pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((value) => value - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  Page {pageNumber} of {pdf.pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageNumber >= pdf.pageCount}
                  onClick={() => setPageNumber((value) => value + 1)}
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag across anything that should be removed. Boxes are kept as you move between
              pages.
            </p>
          </div>

          {progress ? (
            <ProcessingProgress
              label="Removing the content"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Rebuilding page ${progress.done} of ${progress.total}`}
            />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run} disabled={boxes.length === 0}>
              <SquareSlash aria-hidden="true" />
              Remove and download
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not redact the document" message={error} />}
    </WidgetStack>
  );
}
