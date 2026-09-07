"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Crop, Maximize2 } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { cropPdf, FULL_PAGE, type CropRect, type OutputPageSize } from "@/lib/pdf/crop";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { formatBytes, withSuffix } from "@/lib/utils";

type Handle = "nw" | "ne" | "sw" | "se";
type Drag =
  | { kind: "move"; startX: number; startY: number; origin: CropRect }
  | { kind: "resize"; handle: Handle; origin: CropRect };

const MIN_SIZE = 0.05;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CropWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [pageNumber, setPageNumber] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [rect, setRect] = useState<CropRect>({ x: 0.06, y: 0.06, width: 0.88, height: 0.88 });
  const [allPages, setAllPages] = useState(true);
  const [pageSize, setPageSize] = useState<OutputPageSize>("keep");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  // Render the page being cropped.
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

  const pointFromEvent = useCallback((event: PointerEvent | React.PointerEvent) => {
    const surface = surfaceRef.current;
    if (!surface) return { x: 0, y: 0 };
    const bounds = surface.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
  }, []);

  // Pointer move and release are tracked on the window so the drag survives
  // the cursor leaving the page image.
  useEffect(() => {
    function onMove(event: PointerEvent) {
      const active = drag.current;
      if (!active) return;
      const point = pointFromEvent(event);

      if (active.kind === "move") {
        const dx = point.x - active.startX;
        const dy = point.y - active.startY;
        setRect({
          ...active.origin,
          x: clamp(active.origin.x + dx, 0, 1 - active.origin.width),
          y: clamp(active.origin.y + dy, 0, 1 - active.origin.height),
        });
        return;
      }

      const origin = active.origin;
      const right = origin.x + origin.width;
      const bottom = origin.y + origin.height;
      let { x, y } = origin;
      let width = origin.width;
      let height = origin.height;

      if (active.handle === "nw" || active.handle === "sw") {
        x = clamp(point.x, 0, right - MIN_SIZE);
        width = right - x;
      } else {
        width = clamp(point.x - origin.x, MIN_SIZE, 1 - origin.x);
      }
      if (active.handle === "nw" || active.handle === "ne") {
        y = clamp(point.y, 0, bottom - MIN_SIZE);
        height = bottom - y;
      } else {
        height = clamp(point.y - origin.y, MIN_SIZE, 1 - origin.y);
      }
      setRect({ x, y, width, height });
    }

    function onUp() {
      drag.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pointFromEvent]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.05 : 0.01;
    const grow = event.altKey;

    setRect((current) => {
      if (grow) {
        const width =
          event.key === "ArrowRight"
            ? clamp(current.width + step, MIN_SIZE, 1 - current.x)
            : event.key === "ArrowLeft"
              ? clamp(current.width - step, MIN_SIZE, 1 - current.x)
              : current.width;
        const height =
          event.key === "ArrowDown"
            ? clamp(current.height + step, MIN_SIZE, 1 - current.y)
            : event.key === "ArrowUp"
              ? clamp(current.height - step, MIN_SIZE, 1 - current.y)
              : current.height;
        return { ...current, width, height };
      }
      const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
      const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
      return {
        ...current,
        x: clamp(current.x + dx, 0, 1 - current.width),
        y: clamp(current.y + dy, 0, 1 - current.height),
      };
    });
  }

  async function run() {
    if (!pdf) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await cropPdf(pdf.bytes, rect, {
          pageNumbers: allPages ? undefined : [pageNumber],
          pageSize,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while cropping your PDF. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setPageNumber(1);
    setRect({ x: 0.06, y: 0.06, width: 0.88, height: 0.88 });
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.file.name, "cropped");
    return (
      <DownloadResult
        title="Your cropped PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Pages cropped", value: allPages ? String(pdf.pageCount) : "1" },
          {
            label: "Page size",
            value: pageSize === "keep" ? "Crop box" : pageSize === "a4" ? "A4" : "US Letter",
          },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note={
          pageSize === "keep"
            ? "Cropping hides the margins rather than deleting the content, so the page can be widened again later."
            : "The cropped area was scaled to fit a printable sheet, centred with a small margin."
        }
        downloadLabel="Download cropped PDF"
        restartLabel="Crop another PDF"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader extensions={["pdf"]} disabled={loading} onFiles={load} />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={pdf.pageCount}
            onRemove={busy ? undefined : reset}
          />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border bg-card p-4 shadow-subtle">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={allPages} onCheckedChange={setAllPages} />
              <span className="font-medium">Apply selection to all pages</span>
            </label>

            <Button variant="secondary" size="sm" onClick={() => setRect(FULL_PAGE)}>
              <Maximize2 aria-hidden="true" />
              Select whole page
            </Button>

            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">Page size</span>
              <NativeSelect
                value={pageSize}
                onChange={(value) => setPageSize(value as OutputPageSize)}
                aria-label="Page size of the cropped document"
                className="h-9 w-44"
                options={[
                  { value: "keep", label: "Same as crop box" },
                  { value: "a4", label: "A4 (210 × 297 mm)" },
                  { value: "letter", label: "US Letter (8.5 × 11 in)" },
                ]}
              />
            </label>

            <span className="ml-auto text-sm tabular-nums text-muted-foreground">
              Keeping {Math.round(rect.width * 100)}% × {Math.round(rect.height * 100)}%
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
            <div
              ref={surfaceRef}
              className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl bg-card shadow-card"
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

              {preview && (
                <div
                  role="group"
                  tabIndex={0}
                  aria-label="Crop area. Arrow keys move it, Alt with arrow keys resizes it."
                  onKeyDown={onKeyDown}
                  onPointerDown={(event) => {
                    const point = pointFromEvent(event);
                    drag.current = {
                      kind: "move",
                      startX: point.x,
                      startY: point.y,
                      origin: rect,
                    };
                  }}
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.width * 100}%`,
                    height: `${rect.height * 100}%`,
                    boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.55)",
                  }}
                  className="absolute cursor-move touch-none border-2 border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {/* Rule-of-thirds guides */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/40"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/40"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/40"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/40"
                  />

                  {(["nw", "ne", "sw", "se"] as Handle[]).map((handle) => (
                    <span
                      key={handle}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        drag.current = { kind: "resize", handle, origin: rect };
                      }}
                      className={[
                        "absolute size-4 rounded-full border-2 border-primary bg-card",
                        handle === "nw" && "-left-2 -top-2 cursor-nwse-resize",
                        handle === "ne" && "-right-2 -top-2 cursor-nesw-resize",
                        handle === "sw" && "-bottom-2 -left-2 cursor-nesw-resize",
                        handle === "se" && "-bottom-2 -right-2 cursor-nwse-resize",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  ))}
                </div>
              )}
            </div>

            {pdf.pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((page) => page - 1)}
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
                  onClick={() => setPageNumber((page) => page + 1)}
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag inside the box to move it, or pull a corner to resize. With the box focused,
              arrow keys move it and Alt with arrow keys resizes it.
            </p>
          </div>

          {busy ? (
            <ProcessingProgress label="Cropping your PDF" value={null} />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              <Crop aria-hidden="true" />
              Crop PDF
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not crop the PDF" message={error} />}
    </WidgetStack>
  );
}
