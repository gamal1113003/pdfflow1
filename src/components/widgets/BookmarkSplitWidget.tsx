"use client";

import { useEffect, useState } from "react";
import { Bookmark, Scissors } from "lucide-react";
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
import { zipFiles } from "@/lib/pdf/images";
import {
  readBookmarks,
  splitAtBookmarks,
  type Bookmark as Mark,
  type SplitPart,
} from "@/lib/pdf/bookmarks";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { cn, formatBytes } from "@/lib/utils";

export function BookmarkSplitWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [marks, setMarks] = useState<Mark[] | null>(null);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [maxDepth, setMaxDepth] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [parts, setParts] = useState<SplitPart[] | null>(null);

  useEffect(() => {
    if (!pdf) {
      setMarks(null);
      return;
    }
    readBookmarks(pdf.bytes)
      .then((found) => {
        setMarks(found);
        // Top-level bookmarks selected by default: splitting at every
        // sub-heading of a long report produces dozens of tiny files.
        setChosen(new Set(found.filter((mark) => mark.depth === 0).map((mark) => mark.page)));
        setMaxDepth(Math.max(...found.map((mark) => mark.depth)));
        setError(null);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "The bookmarks could not be read."),
      );
  }, [pdf, setError]);

  async function run() {
    if (!pdf || !marks) return;
    setError(null);
    const selected = marks.filter((mark) => chosen.has(mark.page));
    setProgress({ done: 0, total: selected.length });
    try {
      setParts(
        await splitAtBookmarks(
          pdf.bytes,
          selected,
          pdf.displayName.replace(/\.pdf$/i, ""),
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The document could not be split.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setParts(null);
    setMarks(null);
    setChosen(new Set());
    clear();
  }

  if (parts && pdf) {
    return (
      <>
        <DownloadResult
          title={`${parts.length} ${parts.length === 1 ? "document" : "documents"} created`}
          fileName={`${pdf.displayName.replace(/\.pdf$/i, "")}-sections.zip`}
          stats={[
            { label: "Sections", value: String(parts.length) },
            { label: "Pages in total", value: String(parts.reduce((sum, p) => sum + p.pages, 0)) },
          ]}
          note="Each section keeps its bookmark title as the file name."
          downloadLabel="Download all as a ZIP"
          restartLabel="Split another document"
          onDownload={async () => {
            const zip = await zipFiles(
              parts.map((part) => ({ fileName: part.fileName, blob: toBlob(part.bytes) })),
            );
            downloadBlob(zip, `${pdf.displayName.replace(/\.pdf$/i, "")}-sections.zip`);
          }}
          onRestart={reset}
          onDelete={reset}
        />

        <ul className="mt-6 space-y-2">
          {parts.map((part) => (
            <li
              key={part.fileName}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{part.title}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {part.pages} {part.pages === 1 ? "page" : "pages"} ·{" "}
                {formatBytes(part.bytes.byteLength)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadBlob(toBlob(part.bytes), part.fileName)}
              >
                Download
              </Button>
            </li>
          ))}
        </ul>
      </>
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
            onRemove={progress ? undefined : reset}
          />

          {progress ? (
            <ProcessingProgress
              label="Splitting the document"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Section ${progress.done} of ${progress.total}`}
            />
          ) : (
            marks && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {chosen.size} of {marks.length} bookmarks chosen
                  </p>
                  {maxDepth > 0 && (
                    <div className="ml-auto flex gap-2">
                      {Array.from({ length: maxDepth + 1 }, (_, depth) => (
                        <Button
                          key={depth}
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setChosen(
                              new Set(
                                marks.filter((mark) => mark.depth <= depth).map((mark) => mark.page),
                              ),
                            )
                          }
                        >
                          {depth === 0 ? "Top level only" : `Down to level ${depth + 1}`}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <ul className="max-h-96 space-y-1 overflow-y-auto rounded-2xl border border-border bg-card p-3">
                  {marks.map((mark) => {
                    const selected = chosen.has(mark.page);
                    return (
                      <li key={`${mark.page}-${mark.title}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setChosen((current) => {
                              const next = new Set(current);
                              if (next.has(mark.page)) next.delete(mark.page);
                              else next.add(mark.page);
                              return next;
                            })
                          }
                          style={{ paddingLeft: `${12 + mark.depth * 20}px` }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg py-2 pr-3 text-left text-sm transition-colors",
                            selected ? "bg-primary-soft text-foreground" : "hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded border",
                              selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                            )}
                          >
                            {selected && <Scissors className="size-2.5" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{mark.title}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            p. {mark.page}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={chosen.size === 0}
                  onClick={run}
                >
                  <Bookmark aria-hidden="true" />
                  Split at {chosen.size} {chosen.size === 1 ? "bookmark" : "bookmarks"}
                </Button>
              </>
            )
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not use the bookmarks" message={error} />}
    </WidgetStack>
  );
}
