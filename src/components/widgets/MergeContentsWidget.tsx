"use client";

import { useState } from "react";
import { ListOrdered, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { mergeWithContents, type ContentsEntry } from "@/lib/pdf/contents";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatBytes, moveItem, uid } from "@/lib/utils";

export function MergeContentsWidget() {
  const { language } = useLanguage();
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [heading, setHeading] = useState(language === "ru" ? "Содержание" : "Contents");
  const [outline, setOutline] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; entries: ContentsEntry[] } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setProgress({ done: 0, total: files.length });
    try {
      setResult(
        await mergeWithContents(
          files.map((entry) => entry.file),
          { heading, outline },
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The documents could not be combined.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setFiles([]);
    setResult(null);
    setError(null);
  }

  if (result) {
    const fileName = "bundle.pdf";
    return (
      <>
        <DownloadResult
          title="Your bundle is ready"
          fileName={fileName}
          stats={[
            { label: "Documents", value: String(result.entries.length) },
            {
              label: "Pages",
              value: String(result.entries.reduce((sum, entry) => sum + entry.pages, 0) + 1),
            },
            { label: "Size", value: formatBytes(result.bytes.byteLength) },
          ]}
          note="The index at the front is clickable — each line jumps to where that document begins."
          downloadLabel="Download bundle"
          restartLabel="Make another bundle"
          onDownload={() => downloadBlob(toBlob(result.bytes), fileName)}
          onRestart={reset}
          onDelete={reset}
        />

        <ul className="mt-6 space-y-1.5">
          {result.entries.map((entry) => (
            <li
              key={entry.title}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{entry.title}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                page {entry.startPage}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <WidgetStack>
      <FileUploader
        extensions={ACCEPTED_INPUT}
        multiple
        onFiles={(chosen) =>
          setFiles((current) => [...current, ...chosen.map((file) => ({ id: uid(), file }))])
        }
      />

      {files.length > 0 && (
        <>
          <ul className="space-y-2">
            {files.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{entry.file.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatBytes(entry.file.size)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => setFiles((c) => moveItem(c, index, index - 1))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} up</span>↑
                  </button>
                  <button
                    type="button"
                    disabled={index === files.length - 1}
                    onClick={() => setFiles((c) => moveItem(c, index, index + 1))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} down</span>↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((c) => c.filter((f) => f.id !== entry.id))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                  >
                    <span className="sr-only">Remove {entry.file.name}</span>
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <SettingsPanel
            title="The index"
            description="Each file becomes an entry, named after the file. The order above is the order they appear."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heading">Heading</Label>
                <Input
                  id="heading"
                  value={heading}
                  onChange={(event) => setHeading(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-3 self-end text-sm">
                <Switch checked={outline} onCheckedChange={setOutline} />
                Add bookmarks to the reader&rsquo;s sidebar too
              </label>
            </div>
          </SettingsPanel>

          {progress ? (
            <ProcessingProgress
              label="Combining the documents"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`${progress.done} of ${progress.total}`}
            />
          ) : (
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={files.length < 2}
              onClick={run}
            >
              <ListOrdered aria-hidden="true" />
              Combine {files.length} {files.length === 1 ? "document" : "documents"}
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not combine the documents" message={error} />}
    </WidgetStack>
  );
}
