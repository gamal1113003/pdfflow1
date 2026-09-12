"use client";

import { useState } from "react";
import { Hash } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { addPageNumbers, type NumberPosition } from "@/lib/pdf/extras";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatBytes, withSuffix } from "@/lib/utils";

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "bottom-center", label: "Bottom centre" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-center", label: "Top centre" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
];

export function PageNumbersWidget() {
  const { language } = useLanguage();
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();

  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<"plain" | "slash" | "words">("plain");
  const [startAt, setStartAt] = useState(1);
  const [skipFirst, setSkipFirst] = useState(0);
  const [size, setSize] = useState(10);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setResult(
        await addPageNumbers(
          pdf.bytes,
          {
            position,
            format,
            startAt,
            skipFirst,
            size,
            wordsLabel: language === "ru" ? "Страница" : "Page",
            wordsJoiner: language === "ru" ? "из" : "of",
          },
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The numbers could not be added.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "numbered");
    return (
      <DownloadResult
        title="Your numbered PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Pages numbered", value: String(Math.max(pdf.pageCount - skipFirst, 0)) },
          { label: "Starting at", value: String(startAt) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        downloadLabel="Download numbered PDF"
        restartLabel="Number another document"
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
              label="Adding the numbers"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : (
            <>
              <SettingsPanel title="Where and how">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <NativeSelect
                      id="position"
                      value={position}
                      onChange={(next) => setPosition(next as NumberPosition)}
                      options={POSITIONS}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Style</Label>
                    <NativeSelect
                      id="format"
                      value={format}
                      onChange={(next) => setFormat(next as typeof format)}
                      options={[
                        { value: "plain", label: "3" },
                        { value: "slash", label: "3 / 12" },
                        {
                          value: "words",
                          label: language === "ru" ? "Страница 3 из 12" : "Page 3 of 12",
                        },
                      ]}
                    />
                  </div>
                </div>
              </SettingsPanel>

              <SettingsPanel
                title="Numbering"
                description="Skip a cover page, or continue the numbering from another document."
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="skip">Leave first pages blank</Label>
                    <Input
                      id="skip"
                      type="number"
                      min={0}
                      max={Math.max(pdf.pageCount - 1, 0)}
                      value={skipFirst}
                      onChange={(event) => setSkipFirst(Math.max(0, Number(event.target.value) || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start">Start at</Label>
                    <Input
                      id="start"
                      type="number"
                      min={0}
                      value={startAt}
                      onChange={(event) => setStartAt(Math.max(0, Number(event.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Text size</Label>
                    <Input
                      id="size"
                      type="number"
                      min={6}
                      max={24}
                      value={size}
                      onChange={(event) => setSize(Number(event.target.value) || 10)}
                    />
                  </div>
                </div>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <Hash aria-hidden="true" />
                Add page numbers
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not add page numbers" message={error} />}
    </WidgetStack>
  );
}
