"use client";

import { useState } from "react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { COMPRESSION_LEVELS, compressPdf, type CompressionLevel } from "@/lib/pdf/compress";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { formatBytes, percentSaved, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

export function CompressWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [level, setLevel] = useState<CompressionLevel>("basic");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; keptText: boolean } | null>(null);

  const busy = progress !== null;

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress(0);
    try {
      const output = await compressPdf(pdf.bytes, level, (fraction) =>
        setProgress(Math.round(fraction * 100)),
      );
      setResult(output);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while processing your PDF. Please try again.",
      );
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    setProgress(null);
    clear();
  }

  if (result && pdf) {
    const saved = percentSaved(pdf.bytes.byteLength, result.bytes.byteLength);
    const grew = result.bytes.byteLength >= pdf.bytes.byteLength;
    return (
      <DownloadResult
        fileName={withSuffix(pdf.displayName, "compressed")}
        stats={[
          { label: "Original size", value: formatBytes(pdf.bytes.byteLength) },
          { label: "New size", value: formatBytes(result.bytes.byteLength) },
          { label: "Saved", value: `${saved}%`, highlight: saved > 0 },
        ]}
        note={
          grew
            ? "This PDF was already well optimised, so basic compression could not make it smaller. Try Strong if you only need to read the document."
            : result.keptText
              ? "Text, links and bookmarks are unchanged."
              : "Pages were re-rendered as images, so the text is no longer selectable."
        }
        downloadLabel="Download PDF"
        restartLabel="Compress another PDF"
        onDownload={() =>
          downloadBlob(toBlob(result.bytes), withSuffix(pdf.displayName, "compressed"))
        }
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
          title="Drop your PDF here"
          hint="or choose a file from your device"
          buttonLabel="Choose PDF"
          disabled={loading} busy={loading}
          onFiles={load}
        />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={pdf.pageCount}
            onRemove={busy ? undefined : reset}
          />

          {busy ? (
            <ProcessingProgress
              label="Compressing your PDF"
              value={level === "basic" ? null : progress}
              detail={
                level === "basic"
                  ? "Rewriting the file structure."
                  : "Re-rendering each page at a lower quality."
              }
            />
          ) : (
            <>
              <SettingsPanel
                title="Compression level"
                description="Stronger settings redraw each page as an image, which shrinks scans a lot but removes selectable text."
              >
                <RadioGroup
                  value={level}
                  onValueChange={(value) => setLevel(value as CompressionLevel)}
                  aria-label="Compression level"
                >
                  {COMPRESSION_LEVELS.map((option) => (
                    <RadioCard
                      key={option.id}
                      id={`level-${option.id}`}
                      value={option.id}
                      title={option.label}
                      hint={option.hint}
                      checked={level === option.id}
                    />
                  ))}
                </RadioGroup>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                Compress PDF
              </Button>
            </>
          )}
        </>
      )}

      {error && (
        <ErrorNotice
          title="Processing failed"
          message={error}
          action={
            <Button variant="secondary" size="sm" onClick={reset}>
              Try again
            </Button>
          }
        />
      )}
    </WidgetStack>
  );
}
