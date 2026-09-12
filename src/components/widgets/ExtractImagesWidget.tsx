"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { downloadBlob } from "@/lib/pdf/download";
import { zipFiles } from "@/lib/pdf/images";
import { extractImages, type ExtractedImage } from "@/lib/pdf/extras";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes } from "@/lib/utils";

export function ExtractImagesWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [images, setImages] = useState<ExtractedImage[] | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setImages(await extractImages(pdf.bytes, (done, total) => setProgress({ done, total })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The images could not be extracted.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setImages(null);
    clear();
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
            onRemove={progress ? undefined : reset}
          />

          {progress ? (
            <ProcessingProgress
              label="Looking for images"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : images ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={async () => {
                    const zip = await zipFiles(
                      images.map((image) => ({ fileName: image.name, blob: image.blob })),
                    );
                    downloadBlob(zip, `${pdf.displayName.replace(/\.pdf$/i, "")}-images.zip`);
                  }}
                >
                  <Images aria-hidden="true" />
                  Download all {images.length}
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Try another document
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                These are the pictures stored inside the document, at their own resolution — not
                pictures of the pages. For that, use PDF to JPG.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((image) => (
                  <button
                    key={image.name}
                    type="button"
                    onClick={() => downloadBlob(image.blob, image.name)}
                    className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(image.blob)}
                      alt={image.name}
                      className="aspect-square w-full bg-muted object-contain"
                    />
                    <span className="block px-3 py-2 text-xs text-muted-foreground">
                      {image.width}×{image.height} · {formatBytes(image.blob.size)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              <Images aria-hidden="true" />
              Find the images
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not extract the images" message={error} />}
    </WidgetStack>
  );
}
