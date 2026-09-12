"use client";

import { useState } from "react";
import { Type } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { addStamps, EMPTY_STAMPS, type StampSlot, type StampText } from "@/lib/pdf/stamps";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

const SLOTS: { slot: StampSlot; label: string }[] = [
  { slot: "left", label: "Left" },
  { slot: "center", label: "Centre" },
  { slot: "right", label: "Right" },
];

export function StampsWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [stamps, setStamps] = useState<StampText>(EMPTY_STAMPS);
  const [size, setSize] = useState(9);
  const [skipFirst, setSkipFirst] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  function update(where: "header" | "footer", slot: StampSlot, value: string) {
    setStamps({ ...stamps, [where]: { ...stamps[where], [slot]: value } });
  }

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    try {
      setResult(
        await addStamps(
          pdf.bytes,
          stamps,
          { size, margin: 28, colour: "#6b7280", skipFirst },
          pdf.file.name,
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The text could not be added.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "stamped");
    return (
      <DownloadResult
        title="Your document is ready"
        fileName={fileName}
        stats={[
          { label: "Pages", value: String(pdf.pageCount) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        downloadLabel="Download"
        restartLabel="Do another document"
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
              label="Adding the text"
              value={(progress.done / Math.max(progress.total, 1)) * 100}
              detail={`Page ${progress.done} of ${progress.total}`}
            />
          ) : (
            <>
              {(["header", "footer"] as const).map((where) => (
                <SettingsPanel
                  key={where}
                  title={where === "header" ? "Top of the page" : "Bottom of the page"}
                  description={
                    where === "header"
                      ? "Leave a position empty to put nothing there."
                      : "You can use {page}, {total}, {date} and {file} anywhere in the text."
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    {SLOTS.map(({ slot, label }) => (
                      <div key={slot} className="space-y-2">
                        <Label htmlFor={`${where}-${slot}`}>{label}</Label>
                        <Input
                          id={`${where}-${slot}`}
                          value={stamps[where][slot]}
                          placeholder={
                            where === "footer" && slot === "right" ? "{page} / {total}" : undefined
                          }
                          onChange={(event) => update(where, slot, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </SettingsPanel>
              ))}

              <SettingsPanel title="Appearance">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stamp-size">Text size</Label>
                    <Input
                      id="stamp-size"
                      type="number"
                      min={6}
                      max={20}
                      value={size}
                      onChange={(event) => setSize(Number(event.target.value) || 9)}
                    />
                  </div>
                  <label className="flex items-center gap-3 self-end text-sm">
                    <Switch checked={skipFirst} onCheckedChange={setSkipFirst} />
                    Leave the first page alone
                  </label>
                </div>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <Type aria-hidden="true" />
                Add the text
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not add the text" message={error} />}
    </WidgetStack>
  );
}
