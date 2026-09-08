"use client";

import { useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice, InfoNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { SignaturePad } from "@/components/widgets/SignaturePad";
import { Button } from "@/components/ui/button";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { signPdf } from "@/lib/pdf/sign";
import { formatBytes, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

export function SignWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [signature, setSignature] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [placement, setPlacement] = useState({ x: 0.58, y: 0.78, width: 0.28 });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const surface = surfaceRef.current;
    if (!surface) return;
    const box = event.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: (event.clientX - box.left) / surface.clientWidth,
      y: (event.clientY - box.top) / surface.clientHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    setPlacement((current) => ({
      ...current,
      x: clamp((event.clientX - rect.left) / rect.width - dragOffset.current.x, 0, 1 - current.width),
      y: clamp((event.clientY - rect.top) / rect.height - dragOffset.current.y, 0, 0.98),
    }));
  }

  function nudge(dx: number, dy: number) {
    setPlacement((current) => ({
      ...current,
      x: clamp(current.x + dx, 0, 1 - current.width),
      y: clamp(current.y + dy, 0, 0.98),
    }));
  }

  async function run() {
    if (!pdf || !signature) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await signPdf(pdf.bytes, signature, { pageNumber, ...placement }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while signing your PDF. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setSignature(null);
    setPageNumber(1);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "signed");
    return (
      <DownloadResult
        title="Your signed PDF is ready"
        fileName={fileName}
        stats={[
          { label: "Signed page", value: String(pageNumber) },
          { label: "Pages", value: String(pdf.pageCount) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="This adds a visible signature image. It is not a cryptographic digital signature."
        downloadLabel="Download signed PDF"
        restartLabel="Sign another PDF"
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
            onRemove={busy ? undefined : reset}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="space-y-6">
              <SettingsPanel title="Your signature">
                <SignaturePad onChange={setSignature} />
              </SettingsPanel>

              {signature && (
                <SettingsPanel
                  title="Position"
                  description="Drag the signature on the page, or use these controls."
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setPlacement((c) => ({ ...c, width: clamp(c.width - 0.04, 0.08, 0.8) }))
                        }
                      >
                        <Minus aria-hidden="true" />
                        Smaller
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setPlacement((c) => ({ ...c, width: clamp(c.width + 0.04, 0.08, 0.8) }))
                        }
                      >
                        <Plus aria-hidden="true" />
                        Bigger
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSignature(null)}>
                        <Trash2 aria-hidden="true" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid w-40 grid-cols-3 gap-1">
                      <span />
                      <ArrowButton label="Move up" onClick={() => nudge(0, -0.02)}>
                        ↑
                      </ArrowButton>
                      <span />
                      <ArrowButton label="Move left" onClick={() => nudge(-0.02, 0)}>
                        ←
                      </ArrowButton>
                      <span />
                      <ArrowButton label="Move right" onClick={() => nudge(0.02, 0)}>
                        →
                      </ArrowButton>
                      <span />
                      <ArrowButton label="Move down" onClick={() => nudge(0, 0.02)}>
                        ↓
                      </ArrowButton>
                      <span />
                    </div>
                  </div>
                </SettingsPanel>
              )}
            </div>

            <div>
              <PDFViewer
                bytes={pdf.bytes}
                pageNumber={pageNumber}
                onPageChange={setPageNumber}
                maxEdge={800}
                overlay={
                  <div ref={surfaceRef} className="absolute inset-0">
                    {signature && (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Signature. Drag to move, or use the arrow controls."
                        onPointerDown={startDrag}
                        onPointerMove={onDrag}
                        onKeyDown={(event) => {
                          const step = 0.02;
                          if (event.key === "ArrowLeft") nudge(-step, 0);
                          if (event.key === "ArrowRight") nudge(step, 0);
                          if (event.key === "ArrowUp") nudge(0, -step);
                          if (event.key === "ArrowDown") nudge(0, step);
                          if (event.key.startsWith("Arrow")) event.preventDefault();
                        }}
                        style={{
                          left: `${placement.x * 100}%`,
                          top: `${placement.y * 100}%`,
                          width: `${placement.width * 100}%`,
                        }}
                        className="absolute cursor-move touch-none rounded-md border-2 border-dashed border-primary/70"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={signature} alt="Your signature" className="block w-full" />
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </div>

          {!signature && (
            <InfoNotice title="Add a signature to continue">
              Draw, type or upload a signature. It appears on the preview so you can drag it
              exactly where it belongs.
            </InfoNotice>
          )}

          {busy ? (
            <ProcessingProgress label="Applying your signature" value={null} />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run} disabled={!signature}>
              Apply signature
            </Button>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not sign the PDF" message={error} />}
    </WidgetStack>
  );
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="grid h-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
