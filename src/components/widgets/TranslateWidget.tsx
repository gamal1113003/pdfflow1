"use client";

import { useState } from "react";
import { Languages, ScanText, ServerCog } from "lucide-react";
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
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { buildTranslatedPdf, extractPageText, translatePages } from "@/lib/pdf/translate";
import { TRANSLATE_LANGUAGES } from "@/lib/services/translationService";
import { runServiceJob, ServiceUnavailableError } from "@/lib/services/pdfService";
import { formatBytes, withSuffix } from "@/lib/utils";
import { DOCUMENT_INPUT } from "@/lib/pdf/ingest";

export function TranslateWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [target, setTarget] = useState("EN");
  const [stage, setStage] = useState<{ label: string; value: number } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [needsOcr, setNeedsOcr] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const languageName =
    TRANSLATE_LANGUAGES.find((entry) => entry.code === target)?.label ?? target;

  /**
   * Photos, scans and images converted to PDF contain pixels, not text, so
   * there is nothing to extract. Running OCR first gives the document a text
   * layer that can then be translated.
   */
  async function runOcrThenTranslate() {
    if (!pdf) return;
    setNeedsOcr(false);
    setError(null);
    setStage({ label: "Recognising the text", value: 5 });

    try {
      const file = new File([toBlob(pdf.bytes)], pdf.displayName, { type: "application/pdf" });
      const recognised = await runServiceJob("ocr-pdf", file);
      const bytes = new Uint8Array(await recognised.blob.arrayBuffer());
      await translateFrom(bytes);
    } catch (cause) {
      if (cause instanceof ServiceUnavailableError) {
        setUnavailable(true);
      } else {
        setError(
          cause instanceof Error ? cause.message : "Text recognition failed. Please try again.",
        );
      }
      setStage(null);
    }
  }

  async function translateFrom(bytes: Uint8Array) {
    const pages = await extractPageText(bytes, (label, fraction) =>
      setStage({ label, value: fraction * 20 }),
    );

    if (pages.every((page) => !page.trim())) {
      setNeedsOcr(true);
      setStage(null);
      return;
    }

    const translated = await translatePages(pages, target, (label, fraction) =>
      setStage({ label, value: 20 + fraction * 60 }),
    );

    setResult(
      await buildTranslatedPdf(translated, (label, fraction) =>
        setStage({ label, value: 80 + fraction * 20 }),
      ),
    );
  }

  async function run() {
    if (!pdf) return;
    setError(null);
    setUnavailable(false);
    setNeedsOcr(false);
    setStage({ label: "Reading the document", value: 0 });

    try {
      await translateFrom(pdf.bytes);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Translation failed.";
      if (message.includes("provider API key") || message.includes("not configured")) {
        setUnavailable(true);
      } else {
        setError(message);
      }
    } finally {
      setStage(null);
    }
  }

  function reset() {
    setResult(null);
    setUnavailable(false);
    setNeedsOcr(false);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, `translated-${target.toLowerCase()}`);
    return (
      <DownloadResult
        title="Your translated PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Pages read", value: String(pdf.pageCount) },
          { label: "Language", value: languageName },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="This is a clean text version of your document, not a visual copy. The original layout, images and tables are not reproduced."
        downloadLabel="Download translated PDF"
        restartLabel="Translate another PDF"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader extensions={DOCUMENT_INPUT} disabled={loading} busy={loading} onFiles={load} />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={pdf.pageCount}
            onRemove={stage ? undefined : reset}
          />

          {stage ? (
            <ProcessingProgress
              label={stage.label}
              value={stage.value}
              detail="Only the text is sent for translation. The file itself stays on your device."
            />
          ) : (
            <>
              <SettingsPanel title="Translate into">
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="target-language">Language</Label>
                  <NativeSelect
                    id="target-language"
                    value={target}
                    onChange={setTarget}
                    options={TRANSLATE_LANGUAGES.map((entry) => ({
                      value: entry.code,
                      label: entry.label,
                    }))}
                  />
                </div>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <Languages aria-hidden="true" />
                Translate to {languageName}
              </Button>
            </>
          )}
        </>
      )}

      {unavailable && (
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ServerCog className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              No translation provider is connected
            </h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              The free option is LibreTranslate, which you run yourself. Install Docker, then:
            </p>
            <p className="max-w-[62ch] rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
            </p>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              Then add{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">
                LIBRETRANSLATE_URL=http://localhost:5000
              </code>{" "}
              to <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> and restart. For
              better quality, a paid{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">DEEPL_API_KEY</code> works instead.
            </p>
          </div>
        </div>
      )}

      {needsOcr && (
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ScanText className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              This document has no text to translate
            </h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              Photos, scans and images contain pixels rather than text. Text recognition can read
              the words off the page first, and then they can be translated. This runs on the
              server and takes a little longer.
            </p>
            <Button size="sm" onClick={runOcrThenTranslate}>
              <ScanText aria-hidden="true" />
              Recognise text, then translate
            </Button>
          </div>
        </div>
      )}

      {error && <ErrorNotice title="Could not translate the PDF" message={error} />}
    </WidgetStack>
  );
}
