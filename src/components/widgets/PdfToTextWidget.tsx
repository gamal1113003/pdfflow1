"use client";

import { useState } from "react";
import { Copy, FileText } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { downloadBlob } from "@/lib/pdf/download";
import { pdfToText } from "@/lib/pdf/extras";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes } from "@/lib/utils";

export function PdfToTextWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ text: string; emptyPages: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setResult(await pdfToText(pdf.bytes, (done, total) => setProgress({ done, total })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The text could not be extracted.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    setCopied(false);
    clear();
  }

  const fileName = pdf ? `${pdf.displayName.replace(/\.pdf$/i, "")}.txt` : "extracted.txt";

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
              label="Reading the text"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : result ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    downloadBlob(
                      new Blob([result.text], { type: "text/plain;charset=utf-8" }),
                      fileName,
                    )
                  }
                >
                  <FileText aria-hidden="true" />
                  Download as .txt
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <Copy aria-hidden="true" />
                  {copied ? "Copied" : "Copy all"}
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Read another document
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(new Blob([result.text]).size)} of text
                </span>
              </div>

              {result.emptyPages > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.emptyPages} of {pdf.pageCount} pages had no text — those are probably
                  images, and OCR would be needed to read them.
                </p>
              )}

              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed">
                {result.text}
              </pre>
            </>
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              <FileText aria-hidden="true" />
              Extract the text
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not extract the text" message={error} />}
    </WidgetStack>
  );
}
