"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { pagesPerSheet } from "@/lib/pdf/extras";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

const CHOICES = [
  { value: "2", title: "2 per sheet", hint: "Side by side on a landscape page. Still comfortable to read." },
  { value: "4", title: "4 per sheet", hint: "Two by two. Fine for slides and drafts." },
  { value: "6", title: "6 per sheet", hint: "Small, but the text is usually still legible." },
  { value: "9", title: "9 per sheet", hint: "An overview rather than something to read." },
];

export function PagesPerSheetWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [perSheet, setPerSheet] = useState("2");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setResult(
        await pagesPerSheet(pdf.bytes, Number(perSheet) as 2 | 4 | 6 | 9, (done, total) =>
          setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The sheets could not be made.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, `${perSheet}-up`);
    const sheets = Math.ceil(pdf.pageCount / Number(perSheet));
    return (
      <DownloadResult
        title="Your document is ready to print"
        fileName={fileName}
        stats={[
          { label: "Pages in", value: String(pdf.pageCount) },
          { label: "Sheets out", value: String(sheets) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="Print without any scaling — the pages are already laid out at the size they should appear."
        downloadLabel="Download"
        restartLabel="Lay out another document"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
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
              label="Laying out the sheets"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : (
            <>
              <SettingsPanel
                title="How many pages on each sheet?"
                description={`${pdf.pageCount} pages becomes ${Math.ceil(
                  pdf.pageCount / Number(perSheet),
                )} sheets.`}
              >
                <RadioGroup value={perSheet} onValueChange={setPerSheet} aria-label="Pages per sheet">
                  {CHOICES.map((choice) => (
                    <RadioCard
                      key={choice.value}
                      id={`per-${choice.value}`}
                      value={choice.value}
                      title={choice.title}
                      hint={choice.hint}
                      checked={perSheet === choice.value}
                    />
                  ))}
                </RadioGroup>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <LayoutGrid aria-hidden="true" />
                Lay out the pages
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not lay out the pages" message={error} />}
    </WidgetStack>
  );
}
