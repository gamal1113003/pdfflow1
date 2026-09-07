"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { imagesToPdf, type Orientation, type PageSize } from "@/lib/pdf/images";
import type { Tool } from "@/lib/tools";
import { cn, formatBytes, moveItem, uid } from "@/lib/utils";

type Item = { id: string; file: File; url: string };

export function ImagesToPdfWidget({ tool }: { tool: Tool }) {
  const extensions = (tool.config?.accept as string[] | undefined) ?? ["jpg", "jpeg"];
  const label = extensions.includes("png") ? "PNG" : "JPG";

  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState(24);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  useEffect(() => {
    return () => items.forEach((item) => URL.revokeObjectURL(item.url));
    // Revoking on unmount only; per-item URLs are revoked when removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: File[]) {
    setError(null);
    setItems((current) => [
      ...current,
      ...files.map((file) => ({ id: uid(), file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((item) => item.id !== id);
    });
  }

  async function run() {
    setError(null);
    setProgress(0);
    try {
      const bytes = await imagesToPdf(
        items.map((item) => item.file),
        { pageSize, orientation, margin },
        (done, total) => setProgress(Math.round((done / total) * 100)),
      );
      setResult(bytes);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while building your PDF. Please try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setItems([]);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <DownloadResult
        fileName="images.pdf"
        stats={[
          { label: "Images", value: String(items.length) },
          { label: "Pages", value: String(items.length) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        restartLabel="Build another PDF"
        onDownload={() => downloadBlob(toBlob(result), "images.pdf")}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      <FileUploader
        extensions={extensions}
        multiple
        size={items.length > 0 ? "sm" : "lg"}
        title={items.length > 0 ? `Add more ${label} images` : `Drop your ${label} images here`}
        hint={
          items.length > 0
            ? "They are added to the end"
            : "or choose files from your device — each image becomes one page"
        }
        buttonLabel={items.length > 0 ? "Add images" : `Choose ${label} images`}
        disabled={progress !== null}
        onFiles={addFiles}
      />

      {items.length > 0 && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {items.length} {items.length === 1 ? "image" : "images"}
              </h2>
              <p className="text-sm text-muted-foreground">Use the arrows to reorder</p>
            </div>

            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="group relative rounded-xl border border-border bg-background p-2.5"
                >
                  <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{item.file.name}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex gap-0.5">
                      <MiniButton
                        label={`Move ${item.file.name} earlier`}
                        disabled={index === 0}
                        onClick={() => setItems((c) => moveItem(c, index, index - 1))}
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                      </MiniButton>
                      <MiniButton
                        label={`Move ${item.file.name} later`}
                        disabled={index === items.length - 1}
                        onClick={() => setItems((c) => moveItem(c, index, index + 1))}
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </MiniButton>
                      <MiniButton
                        label={`Remove ${item.file.name}`}
                        destructive
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </MiniButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <SettingsPanel title="Page setup">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="page-size">Page size</Label>
                <NativeSelect
                  id="page-size"
                  value={pageSize}
                  onChange={(value) => setPageSize(value as PageSize)}
                  options={[
                    { value: "a4", label: "A4" },
                    { value: "letter", label: "US Letter" },
                    { value: "fit", label: "Fit to image" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <NativeSelect
                  id="orientation"
                  value={orientation}
                  disabled={pageSize === "fit"}
                  onChange={(value) => setOrientation(value as Orientation)}
                  options={[
                    { value: "auto", label: "Match each image" },
                    { value: "portrait", label: "Portrait" },
                    { value: "landscape", label: "Landscape" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Margin</Label>
                <NativeSelect
                  id="margin"
                  value={String(margin)}
                  onChange={(value) => setMargin(Number(value))}
                  options={[
                    { value: "0", label: "None" },
                    { value: "24", label: "Small" },
                    { value: "48", label: "Medium" },
                    { value: "72", label: "Large" },
                  ]}
                />
              </div>
            </div>
          </SettingsPanel>

          {progress !== null ? (
            <ProcessingProgress label="Building your PDF" value={progress} />
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={run}>
                Create PDF
              </Button>
              <Button variant="ghost" size="lg" onClick={reset}>
                Clear all
              </Button>
            </div>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not create the PDF" message={error} />}
    </WidgetStack>
  );
}

function MiniButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35",
        destructive && "hover:bg-destructive-soft hover:text-destructive",
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}
