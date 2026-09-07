"use client";

import { useEffect, useState } from "react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { PDFPageGrid } from "@/components/pdf/PDFPageGrid";
import { usePdfPages } from "@/components/pdf/usePdfPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { planFromPageCount, type PagePlan } from "@/lib/pdf/organize";
import { extractPages, splitByRanges, splitEveryPage, type SplitResult } from "@/lib/pdf/split";
import { zipFiles } from "@/lib/pdf/images";
import { formatBytes, parsePageRanges } from "@/lib/utils";

type SplitMode = "selected" | "every" | "ranges";

const MODES: { id: SplitMode; label: string; hint: string }[] = [
  {
    id: "selected",
    label: "Extract selected pages",
    hint: "Everything you pick below goes into one new PDF.",
  },
  {
    id: "every",
    label: "Split every page",
    hint: "Each page becomes its own PDF, delivered as a ZIP.",
  },
  {
    id: "ranges",
    label: "Split by page ranges",
    hint: "One PDF per range, for example 1-3, 4-8, 9-12.",
  },
];

export function SplitWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [plan, setPlan] = useState<PagePlan[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<SplitMode>("selected");
  const [ranges, setRanges] = useState("1-3, 4-8");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SplitResult[] | null>(null);

  const { thumbnails, rendered, error: previewError } = usePdfPages(pdf?.bytes ?? null);

  useEffect(() => {
    setPlan(pdf ? planFromPageCount(pdf.pageCount) : []);
    setSelected(new Set());
  }, [pdf]);

  const selectedPageNumbers = plan
    .map((page, index) => (selected.has(page.id) ? index + 1 : 0))
    .filter(Boolean);

  async function run() {
    if (!pdf) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "selected") {
        setResults(await extractPages(pdf.bytes, pdf.file.name, selectedPageNumbers));
      } else if (mode === "every") {
        setResults(await splitEveryPage(pdf.bytes, pdf.file.name));
      } else {
        const groups = ranges
          .split(",")
          .map((part) => parsePageRanges(part, pdf.pageCount))
          .filter((group) => group.length > 0);
        setResults(await splitByRanges(pdf.bytes, pdf.file.name, groups));
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while splitting your PDF. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    if (!results) return;
    if (results.length === 1) {
      downloadBlob(toBlob(results[0].bytes), results[0].fileName);
      return;
    }
    const zip = await zipFiles(
      results.map((result) => ({ fileName: result.fileName, blob: toBlob(result.bytes) })),
    );
    downloadBlob(zip, "split-pdfs.zip");
  }

  function reset() {
    setResults(null);
    setPlan([]);
    setSelected(new Set());
    clear();
  }

  if (results && pdf) {
    const totalSize = results.reduce((sum, result) => sum + result.bytes.byteLength, 0);
    return (
      <DownloadResult
        title={results.length === 1 ? "Your PDF is ready" : `${results.length} PDFs are ready`}
        fileName={results.length === 1 ? results[0].fileName : "split-pdfs.zip"}
        stats={[
          { label: "Files created", value: String(results.length) },
          { label: "Pages", value: String(results.reduce((sum, r) => sum + r.pages.length, 0)) },
          { label: "Total size", value: formatBytes(totalSize) },
        ]}
        downloadLabel={results.length === 1 ? "Download PDF" : "Download ZIP"}
        restartLabel="Split another PDF"
        onDownload={downloadAll}
        onRestart={reset}
        onDelete={reset}
      />
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
            onRemove={busy ? undefined : reset}
          />

          <SettingsPanel title="How should we split it?">
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as SplitMode)}
              aria-label="Split mode"
            >
              {MODES.map((option) => (
                <RadioCard
                  key={option.id}
                  id={`split-${option.id}`}
                  value={option.id}
                  title={option.label}
                  hint={option.hint}
                  checked={mode === option.id}
                />
              ))}
            </RadioGroup>

            {mode === "ranges" && (
              <div className="mt-5 max-w-sm space-y-2">
                <Label htmlFor="ranges">Page ranges</Label>
                <Input
                  id="ranges"
                  value={ranges}
                  onChange={(event) => setRanges(event.target.value)}
                  placeholder="1-3, 4-8"
                  inputMode="numeric"
                />
                <p className="text-sm text-muted-foreground">
                  This PDF has {pdf.pageCount} pages. Separate each range with a comma.
                </p>
              </div>
            )}
          </SettingsPanel>

          {mode === "selected" && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelected(new Set(plan.map((page) => page.id)))}
                >
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear selection
                </Button>
                <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
                  {selected.size} of {plan.length} pages selected
                </span>
              </div>

              {rendered < plan.length && (
                <p className="text-sm text-muted-foreground">
                  Rendering previews… {rendered} of {pdf.pageCount}
                </p>
              )}

              <PDFPageGrid
                plan={plan}
                thumbnails={thumbnails}
                actions={[]}
                selectable
                selected={selected}
                onToggleSelect={(id) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
              />
            </>
          )}

          {busy ? (
            <ProcessingProgress label="Splitting your PDF" value={null} />
          ) : (
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={run}
              disabled={mode === "selected" && selected.size === 0}
            >
              Split PDF
            </Button>
          )}
        </>
      )}

      {(error || previewError) && (
        <ErrorNotice title="Split failed" message={error ?? previewError ?? ""} />
      )}
    </WidgetStack>
  );
}
