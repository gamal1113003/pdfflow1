"use client";

import { useState } from "react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { imageFormatOf, pdfBackToImage } from "@/lib/pdf/export";
import { watermarkPdf, type WatermarkPosition } from "@/lib/pdf/watermark";
import { formatBytes, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

const COLORS = [
  { value: "#6b7280", label: "Grey" },
  { value: "#5b45e0", label: "Violet" },
  { value: "#dc2626", label: "Red" },
  { value: "#111827", label: "Black" },
];

export function WatermarkWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState("48");
  const [opacity, setOpacity] = useState("0.2");
  const [rotation, setRotation] = useState("35");
  const [color, setColor] = useState(COLORS[0].value);
  const [position, setPosition] = useState<WatermarkPosition>("diagonal");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!pdf) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await watermarkPdf(pdf.bytes, {
          text,
          fontSize: Number(fontSize),
          opacity: Number(opacity),
          rotation: Number(rotation),
          color,
          position,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while adding the watermark. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  // An upload that arrived as an image should leave as one, rather than as
  // the PDF the tool used internally.
  const imageFormat = imageFormatOf(pdf?.convertedFrom);

  async function downloadResult(bytes: Uint8Array, pdfName: string) {
    if (imageFormat && pdf) {
      const image = await pdfBackToImage(bytes, pdf.file.name, imageFormat);
      downloadBlob(image.blob, image.fileName);
      return;
    }
    downloadBlob(toBlob(bytes), pdfName);
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "watermarked");
    return (
      <DownloadResult
        fileName={imageFormat ? fileName.replace(/\.pdf$/, `.${imageFormat}`) : fileName}
        stats={[
          { label: "Pages stamped", value: String(pdf.pageCount) },
          { label: "Watermark", value: text },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        restartLabel="Watermark another PDF"
        onDownload={() => downloadResult(result, fileName)}
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
            onRemove={busy ? undefined : reset}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <SettingsPanel title="Watermark" description="The same stamp is applied to every page.">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="watermark-text">Text</Label>
                  <Input
                    id="watermark-text"
                    value={text}
                    maxLength={40}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="DRAFT"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="watermark-position">Placement</Label>
                    <NativeSelect
                      id="watermark-position"
                      value={position}
                      onChange={(value) => setPosition(value as WatermarkPosition)}
                      options={[
                        { value: "diagonal", label: "Diagonal across the page" },
                        { value: "center", label: "Centred" },
                        { value: "bottom-right", label: "Bottom right" },
                        { value: "tile", label: "Tiled" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="watermark-color">Colour</Label>
                    <NativeSelect
                      id="watermark-color"
                      value={color}
                      onChange={setColor}
                      options={COLORS}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="watermark-size">Size</Label>
                    <NativeSelect
                      id="watermark-size"
                      value={fontSize}
                      onChange={setFontSize}
                      options={[
                        { value: "24", label: "Small" },
                        { value: "48", label: "Medium" },
                        { value: "72", label: "Large" },
                        { value: "96", label: "Extra large" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="watermark-opacity">Opacity</Label>
                    <NativeSelect
                      id="watermark-opacity"
                      value={opacity}
                      onChange={setOpacity}
                      options={[
                        { value: "0.1", label: "10% — barely there" },
                        { value: "0.2", label: "20%" },
                        { value: "0.35", label: "35%" },
                        { value: "0.6", label: "60% — bold" },
                      ]}
                    />
                  </div>
                </div>

                {position === "diagonal" && (
                  <div className="space-y-2">
                    <Label htmlFor="watermark-rotation">Angle</Label>
                    <NativeSelect
                      id="watermark-rotation"
                      value={rotation}
                      onChange={setRotation}
                      options={[
                        { value: "0", label: "Horizontal" },
                        { value: "35", label: "35 degrees" },
                        { value: "45", label: "45 degrees" },
                        { value: "90", label: "Vertical" },
                      ]}
                    />
                  </div>
                )}
              </div>
            </SettingsPanel>

            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Preview of page 1 without the watermark. Apply it to see the finished file.
              </p>
              <PDFViewer bytes={pdf.bytes} pageNumber={1} maxEdge={640} />
            </div>
          </div>

          {busy ? (
            <ProcessingProgress label="Adding your watermark" value={null} />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run} disabled={!text.trim()}>
              Add watermark
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not add the watermark" message={error} />}
    </WidgetStack>
  );
}
