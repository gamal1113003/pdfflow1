"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Columns2, FileText } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { getPdfInfo, toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { ingestAsPdf, ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import {
  compareText,
  compareVisually,
  diffToPdf,
  type PageDiff,
  type TextChange,
} from "@/lib/pdf/compare";
import { cn, formatBytes } from "@/lib/utils";

type Side = "left" | "right";
type Loaded = { name: string; bytes: Uint8Array; pages: number };
type Mode = "visual" | "text";

export function CompareWidget() {
  const [left, setLeft] = useState<Loaded | null>(null);
  const [right, setRight] = useState<Loaded | null>(null);
  const [mode, setMode] = useState<Mode>("visual");
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [diffs, setDiffs] = useState<PageDiff[] | null>(null);
  const [page, setPage] = useState(1);
  const [changes, setChanges] = useState<{ changes: TextChange[]; truncated: boolean } | null>(
    null,
  );

  async function accept(side: Side, files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(null);
    try {
      const ingested = await ingestAsPdf(file);
      const info = await getPdfInfo(ingested.bytes);
      const loaded = { name: ingested.fileName, bytes: ingested.bytes, pages: info.pageCount };
      if (side === "left") setLeft(loaded);
      else setRight(loaded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That file could not be read.");
    }
  }

  async function run() {
    if (!left || !right) return;
    setError(null);
    setDiffs(null);
    setChanges(null);

    try {
      if (mode === "visual") {
        setBusy({ done: 0, total: Math.max(left.pages, right.pages) });
        const result = await compareVisually(left.bytes, right.bytes, (done, total) =>
          setBusy({ done, total }),
        );
        setDiffs(result);
        setPage(1);
      } else {
        setBusy({ done: 0, total: 1 });
        setChanges(await compareText(left.bytes, right.bytes));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The comparison failed.");
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setLeft(null);
    setRight(null);
    setDiffs(null);
    setChanges(null);
    setError(null);
  }

  const ready = left && right;

  return (
    <WidgetStack>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["left", "right"] as Side[]).map((side) => {
          const loaded = side === "left" ? left : right;
          const label = side === "left" ? "Original" : "Changed version";
          return (
            <div key={side}>
              <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
              {loaded ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{loaded.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(loaded.bytes.byteLength)} · {loaded.pages} pages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (side === "left" ? setLeft(null) : setRight(null))}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <FileUploader
                  extensions={ACCEPTED_INPUT}
                  size="sm"
                  title={side === "left" ? "Drop the original" : "Drop the new version"}
                  hint="or choose a file"
                  buttonLabel="Choose file"
                  onFiles={(files) => accept(side, files)}
                />
              )}
            </div>
          );
        })}
      </div>

      {ready && !busy && !diffs && !changes && (
        <>
          <SettingsPanel title="How should they be compared?">
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
              aria-label="Comparison mode"
            >
              <RadioCard
                id="mode-visual"
                value="visual"
                title="Side by side, visually"
                hint="Marks in red wherever the pages differ. Catches moved images and changed spacing, and works on scans."
                checked={mode === "visual"}
              />
              <RadioCard
                id="mode-text"
                value="text"
                title="By wording"
                hint="Finds which words were added and removed, ignoring layout. Needs text in the document, so not scans."
                checked={mode === "text"}
              />
            </RadioGroup>
          </SettingsPanel>

          <Button size="lg" className="w-full sm:w-auto" onClick={run}>
            <Columns2 aria-hidden="true" />
            Compare
          </Button>
        </>
      )}

      {busy && (
        <ProcessingProgress
          label={mode === "visual" ? "Comparing the pages" : "Comparing the wording"}
          value={mode === "visual" ? (busy.done / Math.max(busy.total, 1)) * 100 : null}
          detail={mode === "visual" ? `Page ${busy.done} of ${busy.total}` : undefined}
        />
      )}

      {diffs && (
        <>
          <DownloadResult
            title={
              diffs.some((diff) => diff.changed > 0.001)
                ? "Differences found"
                : "The pages look identical"
            }
            fileName="comparison.pdf"
            stats={[
              { label: "Pages compared", value: String(diffs.length) },
              {
                label: "Pages with changes",
                value: String(diffs.filter((diff) => diff.changed > 0.001).length),
              },
              {
                label: "Most changed",
                value: `${Math.round(Math.max(...diffs.map((d) => d.changed)) * 100)}%`,
              },
            ]}
            note="Red marks show where the two versions differ. The download contains every page with the marks applied."
            downloadLabel="Download comparison"
            restartLabel="Compare other files"
            onDownload={async () => downloadBlob(toBlob(await diffToPdf(diffs)), "comparison.pdf")}
            onRestart={reset}
          />

          <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diffs[page - 1].dataUrl}
              alt={`Page ${page} comparison`}
              className="mx-auto block w-full max-w-3xl rounded-xl border border-border bg-card"
            />

            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                Page {page} of {diffs.length}
                {diffs[page - 1].onlyIn === "left" && " · only in the original"}
                {diffs[page - 1].onlyIn === "right" && " · only in the new version"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= diffs.length}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      {changes && (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <span className="text-sm">
              <span className="font-medium text-success">
                {changes.changes.filter((entry) => entry.kind === "added").length}
              </span>{" "}
              additions
            </span>
            <span className="text-sm">
              <span className="font-medium text-destructive">
                {changes.changes.filter((entry) => entry.kind === "removed").length}
              </span>{" "}
              removals
            </span>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={reset}>
              Compare other files
            </Button>
          </div>

          {changes.truncated && (
            <p className="text-sm text-muted-foreground">
              These documents are long, so only the first several thousand words were compared.
            </p>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 leading-relaxed sm:p-6">
            {changes.changes.map((entry, index) => (
              <span
                key={index}
                className={cn(
                  entry.kind === "added" && "rounded bg-success-soft px-0.5 text-success",
                  entry.kind === "removed" &&
                    "rounded bg-destructive-soft px-0.5 text-destructive line-through",
                  entry.kind === "same" && "text-muted-foreground",
                )}
              >
                {entry.text}{" "}
              </span>
            ))}
          </div>
        </>
      )}

      {error && <ErrorNotice title="Could not compare the files" message={error} />}
    </WidgetStack>
  );
}
