"use client";

import { useState } from "react";
import { Languages, ServerCog } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice, InfoNotice } from "@/components/pdf/Notices";
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
import { formatBytes, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

export function TranslateWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [target, setTarget] = useState("EN");
  const [stage, setStage] = useState<{ label: string; value: number } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const languageName =
    TRANSLATE_LANGUAGES.find((entry) => entry.code === target)?.label ?? target;

  async function run() {
    if (!pdf) return;
    setError(null);
    setUnavailable(false);
    setStage({ label: "Reading the document", value: 0 });

    try {
      const pages = await extractPageText(pdf.bytes, (label, fraction) =>
        setStage({ label, value: fraction * 20 }),
      );

      if (pages.every((page) => !page.trim())) {
        setError(
          "No readable text was found in this PDF. Scanned pages need OCR before they can be translated.",
        );
        return;
      }

      const translated = await translatePages(pages, target, (label, fraction) =>
        setStage({ label, value: 20 + fraction * 60 }),
      );

      const bytes = await buildTranslatedPdf(translated, (label, fraction) =>
        setStage({ label, value: 80 + fraction * 20 }),
      );

      setResult(bytes);
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
        <FileUploader extensions={ACCEPTED_INPUT} disabled={loading} busy={loading} onFiles={load} />
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

              <InfoNotice title="Read this before you start">
                Unlike the other tools, this one sends the text of your document to a translation
                provider. The file never leaves your device, but the words in it do. The result is
                a readable text document — the original layout, images and tables are not
                reproduced, because translated text is a different length and would not fit.
              </InfoNotice>

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

      {error && <ErrorNotice title="Could not translate the PDF" message={error} />}
    </WidgetStack>
  );
}
