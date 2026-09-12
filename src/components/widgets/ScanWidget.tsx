"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, FileDown, ImagePlus, RotateCcw, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import {
  buildScanPdf,
  FULL_QUAD,
  processScan,
  type Enhancement,
  type Quad,
  type ScanPage,
} from "@/lib/pdf/scan";
import { formatBytes, uid } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TREATMENTS: { value: Enhancement; label: string; hint: string }[] = [
  { value: "paper", label: "Scan", hint: "Black on white, like a photocopier" },
  { value: "grey", label: "Grey", hint: "Keeps shading, good for pencil" },
  { value: "colour", label: "Colour", hint: "Brightened, keeps stamps and ink colour" },
  { value: "original", label: "As taken", hint: "No adjustment at all" },
];

export function ScanWidget() {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  const page = pages[active];

  // --- Camera -------------------------------------------------------------
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera on a phone, where one exists.
        video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 } },
      });
      streamRef.current = stream;
      setCameraOn(true);
      // The element only exists once the state has rendered.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError(
        "The camera could not be opened. Permission may have been declined, or this device has none — you can add photographs from your files instead.",
      );
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    addPage(canvas.toDataURL("image/jpeg", 0.95));
  }

  function addPage(source: string) {
    setPages((current) => {
      const next = [...current, { id: uid(), source, quad: FULL_QUAD, enhancement: "paper" as Enhancement }];
      setActive(next.length - 1);
      return next;
    });
  }

  async function addFiles(files: File[]) {
    for (const file of files) {
      const source = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      addPage(source);
    }
  }

  // --- Corner dragging ----------------------------------------------------
  const pointOf = useCallback((event: { clientX: number; clientY: number }) => {
    const surface = surfaceRef.current;
    if (!surface) return { x: 0, y: 0 };
    const bounds = surface.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
    };
  }, []);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const index = dragging.current;
      if (index === null) return;
      event.preventDefault();
      const point = pointOf(event);
      setPages((current) =>
        current.map((entry, position) => {
          if (position !== active) return entry;
          const quad = [...entry.quad] as Quad;
          quad[index] = point;
          return { ...entry, quad };
        }),
      );
    }
    const onUp = () => {
      dragging.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [active, pointOf]);

  // --- Preview ------------------------------------------------------------
  useEffect(() => {
    if (!page) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      processScan(page, 900)
        .then((processed) => {
          if (!cancelled) setPreview(processed.dataUrl);
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        });
    }, 120); // Debounced: dragging a corner would otherwise recompute constantly.

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page]);

  async function run() {
    setError(null);
    setProgress({ done: 0, total: pages.length });
    try {
      setResult(await buildScanPdf(pages, (done, total) => setProgress({ done, total })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The document could not be built.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    stopCamera();
    setPages([]);
    setActive(0);
    setResult(null);
    setError(null);
  }

  if (result) {
    const fileName = "scan.pdf";
    return (
      <DownloadResult
        title="Your scan is ready"
        fileName={fileName}
        stats={[
          { label: "Pages", value: String(pages.length) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="The pages have had their perspective corrected, so they sit square even though the photographs were taken at an angle. To make the text searchable, run the result through OCR."
        downloadLabel="Download scan"
        restartLabel="Scan something else"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {cameraOn ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="block max-h-[60vh] w-full object-contain"
          />
          <div className="flex flex-wrap items-center justify-center gap-3 bg-card p-4">
            <Button size="lg" onClick={capture}>
              <Camera aria-hidden="true" />
              Take the picture
            </Button>
            <Button variant="secondary" onClick={stopCamera}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={startCamera}>
            <Camera aria-hidden="true" />
            Use the camera
          </Button>
          <span className="self-center text-sm text-muted-foreground">
            or add photographs you have already taken
          </span>
        </div>
      )}

      {!cameraOn && (
        <FileUploader
          extensions={["jpg", "jpeg", "png", "webp"]}
          multiple
          size="sm"
          title="Add photographs"
          hint="one per page"
          buttonLabel="Choose photographs"
          onFiles={addFiles}
        />
      )}

      {pages.length > 0 && page && (
        <>
          {/* Page strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((entry, index) => (
              <div key={entry.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "block overflow-hidden rounded-xl border-2 transition-colors",
                    index === active ? "border-primary" : "border-border hover:border-foreground/20",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.source} alt={`Page ${index + 1}`} className="h-20 w-16 object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPages((current) => current.filter((item) => item.id !== entry.id));
                    setActive((current) => Math.max(0, Math.min(current, pages.length - 2)));
                  }}
                  className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-card hover:text-destructive"
                >
                  <span className="sr-only">Remove page {index + 1}</span>
                  <X className="size-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Corner adjustment */}
            <div>
              <p className="mb-2 text-sm font-medium">Drag the corners onto the page</p>
              <div
                ref={surfaceRef}
                className="relative touch-none overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.source}
                  alt={`Page ${active + 1}`}
                  draggable={false}
                  className="block w-full select-none"
                />

                <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
                  <polygon
                    points={page.quad.map((c) => `${c.x * 100}%,${c.y * 100}%`).join(" ")}
                    className="fill-primary/15 stroke-primary"
                    strokeWidth={2}
                  />
                </svg>

                {page.quad.map((corner, index) => (
                  <button
                    key={index}
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      dragging.current = index;
                    }}
                    style={{ left: `${corner.x * 100}%`, top: `${corner.y * 100}%` }}
                    className="absolute size-7 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-primary bg-card shadow-card"
                  >
                    <span className="sr-only">Corner {index + 1}</span>
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  setPages((current) =>
                    current.map((entry, index) =>
                      index === active ? { ...entry, quad: FULL_QUAD } : entry,
                    ),
                  )
                }
              >
                <RotateCcw aria-hidden="true" />
                Reset the corners
              </Button>
            </div>

            {/* Result preview */}
            <div>
              <p className="mb-2 text-sm font-medium">How it will look</p>
              <div className="grid min-h-64 place-items-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Corrected page"
                    className="max-h-[28rem] w-auto rounded-lg bg-white shadow-card"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Working…</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {TREATMENTS.map((treatment) => (
                  <button
                    key={treatment.value}
                    type="button"
                    title={treatment.hint}
                    onClick={() =>
                      setPages((current) =>
                        current.map((entry, index) =>
                          index === active ? { ...entry, enhancement: treatment.value } : entry,
                        ),
                      )
                    }
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      page.enhancement === treatment.value
                        ? "border-primary bg-primary-soft/60 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                  >
                    {treatment.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {TREATMENTS.find((entry) => entry.value === page.enhancement)?.hint}
              </p>
            </div>
          </div>

          {progress ? (
            <ProcessingProgress
              label="Building the document"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={run}>
                <FileDown aria-hidden="true" />
                Make a PDF of {pages.length} {pages.length === 1 ? "page" : "pages"}
              </Button>
              <Button size="lg" variant="secondary" onClick={startCamera}>
                <ImagePlus aria-hidden="true" />
                Add another page
              </Button>
            </div>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not scan" message={error} />}
    </WidgetStack>
  );
}
