"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Undo2 } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice, InfoNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { AnnotateToolbar, type EditorTool } from "@/components/widgets/AnnotateToolbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { imageFormatOf, pdfBackToImage } from "@/lib/pdf/export";
import { applyAnnotations, TEXT_FONT_STACK, type Annotation, type Point } from "@/lib/pdf/annotate";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { formatBytes, uid, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

const TEXT_SIZE = 0.026;
const STROKE_WIDTH = 0.004;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function normaliseRect(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

export function EditContentWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [pageNumber, setPageNumber] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [color, setColor] = useState("#dc2626");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flatten, setFlatten] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [surfaceHeight, setSurfaceHeight] = useState(800);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const gesture = useRef<{ start: Point; id: string } | null>(null);
  const moving = useRef<{ id: string; grab: Point } | null>(null);

  const pageAnnotations = annotations.filter((item) => item.page === pageNumber);

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
        const rendered = await renderPage(doc, target, { maxEdge: 1200, quality: 0.92 });
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

  // Text is stored as a fraction of page height, so it needs the rendered size
  // in pixels to be displayed at the right scale.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setSurfaceHeight(entry.contentRect.height || 800);
    });
    observer.observe(surface);
    return () => observer.disconnect();
  }, [preview]);

  const pointOf = useCallback((event: { clientX: number; clientY: number }): Point => {
    const surface = surfaceRef.current;
    if (!surface) return { x: 0, y: 0 };
    const bounds = surface.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height),
    };
  }, []);

  const update = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations((current) =>
      current.map((item) => (item.id === id ? ({ ...item, ...patch } as Annotation) : item)),
    );
  }, []);

  // Drag handling lives on the window so gestures survive leaving the page.
  useEffect(() => {
    function onMove(event: PointerEvent) {
      const point = pointOf(event);

      if (moving.current) {
        const { id, grab } = moving.current;
        setAnnotations((current) =>
          current.map((item) => {
            if (item.id !== id) return item;
            const dx = point.x - grab.x;
            const dy = point.y - grab.y;
            if (item.kind === "text") {
              return { ...item, at: { x: clamp01(item.at.x + dx), y: clamp01(item.at.y + dy) } };
            }
            if (item.kind === "draw") {
              return {
                ...item,
                points: item.points.map((p) => ({ x: clamp01(p.x + dx), y: clamp01(p.y + dy) })),
              };
            }
            return {
              ...item,
              rect: {
                ...item.rect,
                x: clamp01(item.rect.x + dx),
                y: clamp01(item.rect.y + dy),
              },
            };
          }),
        );
        moving.current = { id, grab: point };
        return;
      }

      const active = gesture.current;
      if (!active) return;

      setAnnotations((current) =>
        current.map((item) => {
          if (item.id !== active.id) return item;
          if (item.kind === "draw") {
            return { ...item, points: [...item.points, point] };
          }
          if (item.kind === "text") return item;
          return { ...item, rect: normaliseRect(active.start, point) };
        }),
      );
    }

    function onUp() {
      const active = gesture.current;
      gesture.current = null;
      moving.current = null;
      if (!active) return;
      // Drop gestures that were an accidental click rather than a drag.
      setAnnotations((current) =>
        current.filter((item) => {
          if (item.id !== active.id) return true;
          if (item.kind === "draw") return item.points.length > 2;
          if (item.kind === "text" || item.kind === "image") return true;
          return item.rect.width > 0.01 && item.rect.height > 0.01;
        }),
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

  function startGesture(event: React.PointerEvent) {
    if (tool === "select") {
      setSelectedId(null);
      return;
    }
    if (tool === "image") {
      imageInputRef.current?.click();
      return;
    }

    const start = pointOf(event);
    const id = uid();

    if (tool === "text") {
      const annotation: Annotation = {
        id,
        page: pageNumber,
        kind: "text",
        at: start,
        text: "",
        size: TEXT_SIZE,
        color,
      };
      setAnnotations((current) => [...current, annotation]);
      setSelectedId(id);
      setEditingId(id);
      setTool("select");
      return;
    }

    const base = { id, page: pageNumber, rect: { ...start, width: 0, height: 0 } };
    const annotation: Annotation =
      tool === "draw"
        ? { id, page: pageNumber, kind: "draw", points: [start], color, width: STROKE_WIDTH }
        : tool === "highlight"
          ? { ...base, kind: "highlight", color: "#fde047" }
          : tool === "blackout"
            ? { ...base, kind: "blackout" }
            : { ...base, kind: "rect", color, width: STROKE_WIDTH };

    setAnnotations((current) => [...current, annotation]);
    gesture.current = { start, id };
  }

  function addImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const width = 0.3;
        const height = (width * image.height) / image.width;
        setAnnotations((current) => [
          ...current,
          {
            id: uid(),
            page: pageNumber,
            kind: "image",
            rect: { x: 0.35, y: 0.35, width, height },
            dataUrl,
          },
        ]);
        setTool("select");
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeSelected() {
    if (!selectedId) return;
    setAnnotations((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId(null);
    setEditingId(null);
  }

  async function run() {
    if (!pdf) return;
    const usable = annotations.filter((item) => item.kind !== "text" || item.text.trim());
    if (usable.length === 0) {
      setError("Add something to the page first — text, a drawing, a shape or an image.");
      return;
    }
    setProgress(0);
    setError(null);
    try {
      setResult(
        await applyAnnotations(pdf.bytes, usable, {
          flatten,
          onProgress: (fraction) => setProgress(Math.round(fraction * 100)),
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while saving your PDF. Please try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    setAnnotations([]);
    setSelectedId(null);
    setEditingId(null);
    setPageNumber(1);
    clear();
  }

  // An upload that arrived as an image should leave as one, rather than as
  // the PDF the tool used internally.
  const imageFormat = imageFormatOf(pdf?.convertedFrom);

  async function downloadResult(bytes: Uint8Array, pdfName: string) {
    if (imageFormat && pdf) {
      const image = await pdfBackToImage(bytes, pdf.file.name, imageFormat);
      downloadBlob(image.blob, image.fileName);
      return;
    }
    downloadBlob(toBlob(bytes), pdfName);
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "edited");
    return (
      <DownloadResult
        title="Your edited PDF is ready"
        fileName={imageFormat ? fileName.replace(/\.pdf$/, `.${imageFormat}`) : fileName}
        stats={[
          { label: "Edits added", value: String(annotations.length) },
          { label: "Pages", value: String(pdf.pageCount) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note={
          flatten
            ? "Pages were flattened to images, so anything under a black-out is gone and text is no longer selectable."
            : "Your edits sit on top of the original page, which keeps the text selectable underneath."
        }
        downloadLabel={imageFormat ? `Download edited ${imageFormat.toUpperCase()}` : "Download edited PDF"}
        restartLabel="Edit another PDF"
        onDownload={() => downloadResult(result, fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader extensions={ACCEPTED_INPUT} disabled={loading} busy={loading} onFiles={load} />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={pdf.pageCount}
            onRemove={progress !== null ? undefined : reset}
          />

          <AnnotateToolbar
            tool={tool}
            onToolChange={setTool}
            color={color}
            onColorChange={(value) => {
              setColor(value);
              if (selectedId) update(selectedId, { color: value } as Partial<Annotation>);
            }}
          />

          <input
            ref={imageInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className="sr-only"
            onChange={(event) => {
              addImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={annotations.length === 0}
              onClick={() => setAnnotations((current) => current.slice(0, -1))}
            >
              <Undo2 aria-hidden="true" />
              Undo
            </Button>
            <Button variant="secondary" size="sm" disabled={!selectedId} onClick={removeSelected}>
              <Trash2 aria-hidden="true" />
              Delete selected
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {pageAnnotations.length} on this page · {annotations.length} in total
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
            <div
              ref={surfaceRef}
              onPointerDown={startGesture}
              className={
                tool === "select"
                  ? "relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl bg-card shadow-card"
                  : "relative mx-auto w-full max-w-3xl cursor-crosshair select-none overflow-hidden rounded-xl bg-card shadow-card"
              }
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

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 size-full"
                aria-hidden="true"
              >
                {pageAnnotations.map((item) => {
                  if (item.kind === "highlight") {
                    return (
                      <rect
                        key={item.id}
                        x={item.rect.x * 100}
                        y={item.rect.y * 100}
                        width={item.rect.width * 100}
                        height={item.rect.height * 100}
                        fill={item.color}
                        opacity={0.42}
                      />
                    );
                  }
                  if (item.kind === "blackout") {
                    return (
                      <rect
                        key={item.id}
                        x={item.rect.x * 100}
                        y={item.rect.y * 100}
                        width={item.rect.width * 100}
                        height={item.rect.height * 100}
                        fill="#000000"
                      />
                    );
                  }
                  if (item.kind === "rect") {
                    return (
                      <rect
                        key={item.id}
                        x={item.rect.x * 100}
                        y={item.rect.y * 100}
                        width={item.rect.width * 100}
                        height={item.rect.height * 100}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={item.width * 100}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }
                  if (item.kind === "draw") {
                    return (
                      <polyline
                        key={item.id}
                        points={item.points.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }
                  return null;
                })}
              </svg>

              {pageAnnotations
                .filter((item) => item.kind === "image")
                .map((item) =>
                  item.kind === "image" ? (
                    <div
                      key={item.id}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedId(item.id);
                        moving.current = { id: item.id, grab: pointOf(event) };
                      }}
                      style={{
                        left: `${item.rect.x * 100}%`,
                        top: `${item.rect.y * 100}%`,
                        width: `${item.rect.width * 100}%`,
                      }}
                      className={
                        selectedId === item.id
                          ? "absolute cursor-move touch-none ring-2 ring-primary"
                          : "absolute cursor-move touch-none"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.dataUrl} alt="" draggable={false} className="block w-full" />
                    </div>
                  ) : null,
                )}

              {pageAnnotations
                .filter((item) => item.kind === "text")
                .map((item) =>
                  item.kind === "text" ? (
                    editingId === item.id ? (
                      <textarea
                        key={item.id}
                        autoFocus
                        value={item.text}
                        onChange={(event) => update(item.id, { text: event.target.value })}
                        onBlur={() => setEditingId(null)}
                        onPointerDown={(event) => event.stopPropagation()}
                        style={{
                          left: `${item.at.x * 100}%`,
                          top: `${item.at.y * 100}%`,
                          fontSize: `${item.size * surfaceHeight}px`,
                          color: item.color,
                          fontFamily: TEXT_FONT_STACK,
                        }}
                        className="absolute z-10 min-w-40 resize border-2 border-primary bg-card/95 p-1 leading-tight outline-none"
                        rows={2}
                        placeholder="Type here"
                      />
                    ) : (
                      <div
                        key={item.id}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          setSelectedId(item.id);
                          moving.current = { id: item.id, grab: pointOf(event) };
                        }}
                        onDoubleClick={() => setEditingId(item.id)}
                        style={{
                          left: `${item.at.x * 100}%`,
                          top: `${item.at.y * 100}%`,
                          fontSize: `${item.size * surfaceHeight}px`,
                          color: item.color,
                          fontFamily: TEXT_FONT_STACK,
                        }}
                        className={
                          selectedId === item.id
                            ? "absolute cursor-move touch-none whitespace-pre leading-tight ring-2 ring-primary"
                            : "absolute cursor-move touch-none whitespace-pre leading-tight"
                        }
                      >
                        {item.text || "Type here"}
                      </div>
                    )
                  ) : null,
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
              Pick a tool, then drag on the page. Double-click a text box to retype it. Edits on
              other pages are kept while you move around.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
            <Switch checked={flatten} onCheckedChange={setFlatten} className="mt-0.5" />
            <span>
              <span className="block font-medium">Flatten pages when saving</span>
              <span className="mt-1 block max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                Turn this on if you blacked something out. Without it the black bar only covers the
                text — the words are still in the file and can be copied out. Flattening redraws
                each page as an image, which removes them for good but makes the page
                non-selectable.
              </span>
            </span>
          </label>

          {progress !== null ? (
            <ProcessingProgress
              label={flatten ? "Flattening and saving" : "Saving your edits"}
              value={progress}
            />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              Save edited PDF
            </Button>
          )}

          <InfoNotice title="What this editor does not do">
            It adds things on top of the page. It cannot rewrite words that are already in the PDF —
            that needs the original fonts and text layout, which a PDF does not store in an editable
            form. To change existing wording, black it out and add your own text over it.
          </InfoNotice>
        </>
      )}

      {error && <ErrorNotice title="Could not save the PDF" message={error} />}
    </WidgetStack>
  );
}
