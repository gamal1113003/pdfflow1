"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { downloadBlob } from "@/lib/pdf/download";
import { pdfToImages, zipFiles, type ExportedImage } from "@/lib/pdf/images";
import { baseName, formatBytes } from "@/lib/utils";

export function PdfToImagesWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [quality, setQuality] = useState("2");
  const [progress, setProgress] = useState<number | null>(null);
  const [images, setImages] = useState<ExportedImage[] | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress(0);
    try {
      const exported = await pdfToImages(
        pdf.bytes,
        pdf.file.name,
        { format: "image/jpeg", scale: Number(quality), quality: 0.9 },
        (done, total) => setProgress(Math.round((done / total) * 100)),
      );
      setImages(exported);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while exporting your pages. Please try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  async function downloadAll() {
    if (!images || !pdf) return;
    if (images.length === 1) {
      downloadBlob(images[0].blob, images[0].fileName);
      return;
    }
    const zip = await zipFiles(images);
    downloadBlob(zip, `${baseName(pdf.file.name)}-images.zip`);
  }

  function reset() {
    setImages(null);
    clear();
  }

  if (images && pdf) {
    const totalSize = images.reduce((sum, image) => sum + image.blob.size, 0);
    return (
      <div className="space-y-6">
        <DownloadResult
          title={`${images.length} ${images.length === 1 ? "image is" : "images are"} ready`}
          fileName={
            images.length === 1 ? images[0].fileName : `${baseName(pdf.file.name)}-images.zip`
          }
          stats={[
            { label: "Pages exported", value: String(images.length) },
            { label: "Format", value: "JPG" },
            { label: "Total size", value: formatBytes(totalSize) },
          ]}
          downloadLabel={images.length === 1 ? "Download image" : "Download ZIP"}
          restartLabel="Convert another PDF"
          onDownload={downloadAll}
          onRestart={reset}
          onDelete={reset}
        />

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.pageNumber} className="rounded-xl border border-border bg-card p-2.5">
              <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt={`Page ${image.pageNumber}`}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs tabular-nums text-muted-foreground">
                  Page {image.pageNumber}
                </span>
                <button
                  type="button"
                  onClick={() => downloadBlob(image.blob, image.fileName)}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="sr-only">Download page {image.pageNumber}</span>
                  <Download className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
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
            onRemove={progress !== null ? undefined : reset}
          />

          {progress !== null ? (
            <ProcessingProgress
              label="Exporting your pages"
              value={progress}
              detail="Rendering each page at the quality you chose."
            />
          ) : (
            <>
              <SettingsPanel
                title="Image quality"
                description="Higher settings produce sharper images and larger files."
              >
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="quality">Resolution</Label>
                  <NativeSelect
                    id="quality"
                    value={quality}
                    onChange={setQuality}
                    options={[
                      { value: "1", label: "Screen — 72 dpi" },
                      { value: "2", label: "Standard — 144 dpi" },
                      { value: "3", label: "High — 216 dpi" },
                      { value: "4", label: "Print — 288 dpi" },
                    ]}
                  />
                </div>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                Convert to JPG
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Conversion failed" message={error} />}
    </WidgetStack>
  );
}
