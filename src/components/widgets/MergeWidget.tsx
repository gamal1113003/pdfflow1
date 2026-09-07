"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText, GripVertical, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { PDFPageThumbnail } from "@/components/pdf/PDFPageThumbnail";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { getPdfInfo, readFileBytes, toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { mergePdfs } from "@/lib/pdf/merge";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { cn, formatBytes, moveItem, uid } from "@/lib/utils";

type Entry = {
  id: string;
  file: File;
  pageCount: number | null;
  thumbnail: string | null;
};

export function MergeWidget() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pending = entries.filter((entry) => entry.thumbnail === null && entry.pageCount === null);
    if (pending.length === 0) return;

    (async () => {
      for (const entry of pending) {
        try {
          const bytes = await readFileBytes(entry.file);
          const info = await getPdfInfo(bytes);
          const doc = await openDocument(bytes);
          const page = await renderPage(doc, 1, { maxEdge: 220 });
          await doc.destroy();
          if (cancelled) return;
          setEntries((current) =>
            current.map((item) =>
              item.id === entry.id
                ? { ...item, pageCount: info.pageCount, thumbnail: page.dataUrl }
                : item,
            ),
          );
        } catch {
          if (cancelled) return;
          setEntries((current) => current.filter((item) => item.id !== entry.id));
          setError(`${entry.file.name} could not be read as a PDF, so it was skipped.`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  function addFiles(files: File[]) {
    setError(null);
    setEntries((current) => [
      ...current,
      ...files.map((file) => ({ id: uid(), file, pageCount: null, thumbnail: null })),
    ]);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= entries.length) return;
    setEntries((current) => moveItem(current, from, to));
  }

  async function run() {
    setError(null);
    setProgress({ done: 0, total: entries.length });
    try {
      const bytes = await mergePdfs(
        entries.map((entry) => entry.file),
        (done, total) => setProgress({ done, total }),
      );
      setResult(bytes);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while merging your PDFs. Please try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setEntries([]);
    setResult(null);
    setError(null);
  }

  const totalPages = entries.reduce((sum, entry) => sum + (entry.pageCount ?? 0), 0);
  const totalSize = entries.reduce((sum, entry) => sum + entry.file.size, 0);

  if (result) {
    return (
      <DownloadResult
        title="Your merged PDF is ready"
        fileName="merged.pdf"
        stats={[
          { label: "Files combined", value: String(entries.length) },
          { label: "Pages", value: String(totalPages) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        downloadLabel="Download merged PDF"
        restartLabel="Merge more PDFs"
        onDownload={() => downloadBlob(toBlob(result), "merged.pdf")}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      <FileUploader
        extensions={["pdf"]}
        multiple
        size={entries.length > 0 ? "sm" : "lg"}
        title={entries.length > 0 ? "Add more PDFs" : "Drop your PDFs here"}
        hint={
          entries.length > 0
            ? "They join the end of the list"
            : "or choose files from your device — you can add as many as you like"
        }
        buttonLabel={entries.length > 0 ? "Add PDFs" : "Choose PDFs"}
        disabled={progress !== null}
        onFiles={addFiles}
      />

      {entries.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-baseline justify-between gap-4 px-1 pb-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {entries.length} {entries.length === 1 ? "file" : "files"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Drag to change the order · {formatBytes(totalSize)}
            </p>
          </div>

          <ul className="space-y-2">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                draggable
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-opacity",
                  dragIndex === index && "opacity-45",
                )}
              >
                <GripVertical
                  className="hidden size-4 shrink-0 cursor-grab text-muted-foreground sm:block"
                  aria-hidden="true"
                />

                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-border">
                  {entry.thumbnail ? (
                    <PDFPageThumbnail
                      src={entry.thumbnail}
                      pageNumber={1}
                      className="aspect-auto h-full w-full"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted">
                      <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-medium">{entry.file.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatBytes(entry.file.size)}
                    {entry.pageCount !== null && ` · ${entry.pageCount} pages`}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} up</span>
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === entries.length - 1}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} down</span>
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntries((current) => current.filter((c) => c.id !== entry.id))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                  >
                    <span className="sr-only">Remove {entry.file.name}</span>
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progress ? (
        <ProcessingProgress
          label="Merging your PDFs"
          value={(progress.done / Math.max(progress.total, 1)) * 100}
          detail={`${progress.done} of ${progress.total} files added`}
        />
      ) : (
        entries.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={run} disabled={entries.length < 2}>
              Merge PDFs
            </Button>
            <Button variant="ghost" size="lg" onClick={reset}>
              Clear all
            </Button>
            {entries.length < 2 && (
              <p className="text-sm text-muted-foreground">Add one more PDF to merge.</p>
            )}
          </div>
        )
      )}

      {error && <ErrorNotice title="Merge failed" message={error} />}
    </WidgetStack>
  );
}
