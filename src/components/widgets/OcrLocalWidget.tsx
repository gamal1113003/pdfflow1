"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ScanText } from "lucide-react";
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
import { toBlob, savePdf } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "rus", label: "Русский" },
  { value: "eng+rus", label: "English + Русский" },
];

/**
 * OCR, page by page, entirely on this machine.
 *
 * Tesseract reads images rather than PDFs, so each page is rendered here with
 * PDF.js, sent to the local helper as an image, and comes back as a
 * single-page searchable PDF. Those are then stitched together.
 *
 * Doing the rasterising in the page rather than in the application means no
 * extra program has to be bundled for it — PDF.js is already here.
 */
export function OcrLocalWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [language, setLanguage] = useState("eng");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });

    try {
      const source = await openDocument(pdf.bytes);
      const output = await PDFDocument.create();

      try {
        for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
          // 300 dpi equivalent: below this, recognition accuracy drops sharply.
          const page = await source.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
          const rendered = await renderPage(source, pageNumber, {
            maxEdge: Math.max(viewport.width, viewport.height) * 4,
            type: "image/png",
          });
          page.cleanup();

          const image = await (await fetch(rendered.dataUrl)).blob();
          const form = new FormData();
          form.append("file", image, `page-${pageNumber}.png`);
          form.append("language", language);

          const response = await fetch("/api/process/ocr-page", {
            method: "POST",
            body: form,
          });

          if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error || "Text recognition failed on this page.");
          }

          const pageBytes = new Uint8Array(await response.arrayBuffer());
          const recognised = await PDFDocument.load(pageBytes);
          const copied = await output.copyPages(recognised, recognised.getPageIndices());
          copied.forEach((entry) => output.addPage(entry));

          setProgress({ done: pageNumber, total: source.numPages });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } finally {
        await source.destroy();
      }

      output.setProducer("orzix");
      setResult(await savePdf(output));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Text recognition failed.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "searchable");
    return (
      <DownloadResult
        title="Your searchable PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Pages read", value: String(pdf.pageCount) },
          { label: "Language", value: language.replace("+", " + ") },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="The pages look the same; the recognised text sits behind them, so the document can now be searched and copied."
        downloadLabel="Download searchable PDF"
        restartLabel="Read another document"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader
          extensions={ACCEPTED_INPUT}
          disabled={loading}
          busy={loading}
          onFiles={load}
        />
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
              detail={`Page ${progress.done} of ${progress.total}. Recognition is slow — roughly a few seconds per page.`}
            />
          ) : (
            <>
              <SettingsPanel
                title="Language"
                description="Choose the language of the text on the page. Picking the wrong one produces nonsense."
              >
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="ocr-language">Text language</Label>
                  <NativeSelect
                    id="ocr-language"
                    value={language}
                    onChange={setLanguage}
                    options={LANGUAGES}
                  />
                </div>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <ScanText aria-hidden="true" />
                Make searchable
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not read the text" message={error} />}
    </WidgetStack>
  );
}
