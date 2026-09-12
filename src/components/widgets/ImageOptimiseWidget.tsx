"use client";

import { useState } from "react";
import { ImageDown, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { downloadBlob } from "@/lib/pdf/download";
import { zipFiles } from "@/lib/pdf/images";
import { optimiseAll, type OptimisedImage } from "@/lib/image/optimise";
import { formatBytes, uid } from "@/lib/utils";

const SIZES = [
  { value: "0", label: "Keep the original size" },
  { value: "3000", label: "3000 px — printing" },
  { value: "1920", label: "1920 px — full screen" },
  { value: "1200", label: "1200 px — web page" },
  { value: "800", label: "800 px — email, messages" },
];

const QUALITIES = [
  { value: "0.92", label: "High — barely distinguishable" },
  { value: "0.8", label: "Good — a sensible default" },
  { value: "0.65", label: "Smaller — visible on close inspection" },
  { value: "0.45", label: "Smallest — noticeably soft" },
];

export function ImageOptimiseWidget() {
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [maxEdge, setMaxEdge] = useState("1920");
  const [quality, setQuality] = useState("0.8");
  const [format, setFormat] = useState("keep");

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<OptimisedImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (files.length === 0) return;
    setError(null);
    setProgress({ done: 0, total: files.length });
    try {
      setResults(
        await optimiseAll(
          files.map((entry) => entry.file),
          {
            maxEdge: Number(maxEdge),
            quality: Number(quality),
            format: format as "keep" | "image/jpeg" | "image/png" | "image/webp",
          },
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The images could not be processed.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setFiles([]);
    setResults(null);
    setError(null);
  }

  const originalTotal = results?.reduce((sum, image) => sum + image.originalSize, 0) ?? 0;
  const newTotal = results?.reduce((sum, image) => sum + image.blob.size, 0) ?? 0;
  const saved = originalTotal > 0 ? Math.round((1 - newTotal / originalTotal) * 100) : 0;

  return (
    <WidgetStack>
      {results ? (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <p className="font-display text-lg font-semibold">
                {saved > 0 ? `${saved}% smaller` : "No saving to be had"}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(originalTotal)} → {formatBytes(newTotal)} across {results.length}{" "}
                {results.length === 1 ? "image" : "images"}
              </p>
            </div>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  if (results.length === 1) {
                    downloadBlob(results[0].blob, results[0].name);
                    return;
                  }
                  const zip = await zipFiles(
                    results.map((image) => ({ fileName: image.name, blob: image.blob })),
                  );
                  downloadBlob(zip, "images.zip");
                }}
              >
                <ImageDown aria-hidden="true" />
                {results.length === 1 ? "Download" : `Download all ${results.length}`}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Start again
              </Button>
            </div>
          </div>

          {saved <= 0 && (
            <p className="text-sm text-muted-foreground">
              These images are already well compressed. Reducing the size or lowering the quality
              would shrink them, at a visible cost.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((image) => (
              <button
                key={image.name}
                type="button"
                onClick={() => downloadBlob(image.blob, image.name)}
                className="overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/40"
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
        <>
          <FileUploader
            extensions={["jpg", "jpeg", "png", "webp"]}
            multiple
            title="Drop your images here"
            hint="or choose files from your device"
            buttonLabel="Choose images"
            onFiles={(chosen) =>
              setFiles((current) => [
                ...current,
                ...chosen.map((file) => ({ id: uid(), file })),
              ])
            }
          />

          {files.length > 0 && (
            <>
              <ul className="space-y-2">
                {files.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{entry.file.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatBytes(entry.file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((c) => c.filter((f) => f.id !== entry.id))}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    >
                      <span className="sr-only">Remove {entry.file.name}</span>
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              <SettingsPanel title="How much smaller?">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="max-edge">Largest side</Label>
                    <NativeSelect id="max-edge" value={maxEdge} onChange={setMaxEdge} options={SIZES} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quality">Quality</Label>
                    <NativeSelect
                      id="quality"
                      value={quality}
                      onChange={setQuality}
                      options={QUALITIES}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <NativeSelect
                      id="format"
                      value={format}
                      onChange={setFormat}
                      options={[
                        { value: "keep", label: "Keep the original" },
                        { value: "image/jpeg", label: "JPG — smallest for photos" },
                        { value: "image/webp", label: "WEBP — smaller still" },
                        { value: "image/png", label: "PNG — lossless, largest" },
                      ]}
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Quality has no effect on PNG, which is lossless — reducing the size is the only
                  way to make one smaller.
                </p>
              </SettingsPanel>

              {progress ? (
                <ProcessingProgress
                  label="Processing the images"
                  value={(progress.done / Math.max(progress.total, 1)) * 100}
                  detail={`${progress.done} of ${progress.total}`}
                />
              ) : (
                <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                  <ImageDown aria-hidden="true" />
                  Compress {files.length} {files.length === 1 ? "image" : "images"}
                </Button>
              )}
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not process the images" message={error} />}
    </WidgetStack>
  );
}
