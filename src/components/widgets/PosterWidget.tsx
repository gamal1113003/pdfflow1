"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { makePoster, type PosterOptions } from "@/lib/pdf/poster";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

export function PosterWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(2);
  const [overlap, setOverlap] = useState(28);
  const [sheet, setSheet] = useState<PosterOptions["sheet"]>("a4");
  const [marks, setMarks] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null);
    setProgress({ done: 0, total: pdf.pageCount * columns * rows });
    try {
      setResult(
        await makePoster(pdf.bytes, { columns, rows, overlap, sheet, marks }, (done, total) =>
          setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The poster could not be made.");
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setResult(null);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, `poster-${columns}x${rows}`);
    return (
      <DownloadResult
        title="Your poster is ready to print"
        fileName={fileName}
        stats={[
          { label: "Sheets", value: String(pdf.pageCount * columns * rows) },
          { label: "Finished size", value: `${columns} × ${rows} sheets` },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="Print at 100% with no scaling, or the pieces will not line up. Trim along the guide lines and overlap the edges when joining."
        downloadLabel="Download poster"
        restartLabel="Make another poster"
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
              detail={`Sheet ${progress.done} of ${progress.total}`}
            />
          ) : (
            <>
              <SettingsPanel
                title="How large?"
                description={`Each page becomes ${columns * rows} sheets, so ${pdf.pageCount} ${
                  pdf.pageCount === 1 ? "page" : "pages"
                } will print on ${pdf.pageCount * columns * rows}.`}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="columns">Sheets across</Label>
                    <Input
                      id="columns"
                      type="number"
                      min={1}
                      max={6}
                      value={columns}
                      onChange={(event) =>
                        setColumns(Math.min(6, Math.max(1, Number(event.target.value) || 1)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rows">Sheets down</Label>
                    <Input
                      id="rows"
                      type="number"
                      min={1}
                      max={6}
                      value={rows}
                      onChange={(event) =>
                        setRows(Math.min(6, Math.max(1, Number(event.target.value) || 1)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet">Paper</Label>
                    <NativeSelect
                      id="sheet"
                      value={sheet}
                      onChange={(next) => setSheet(next as PosterOptions["sheet"])}
                      options={[
                        { value: "a4", label: "A4 portrait" },
                        { value: "a4-landscape", label: "A4 landscape" },
                        { value: "letter", label: "US Letter" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overlap">Overlap (pt)</Label>
                    <Input
                      id="overlap"
                      type="number"
                      min={0}
                      max={72}
                      value={overlap}
                      onChange={(event) => setOverlap(Number(event.target.value) || 0)}
                    />
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm">
                  <Switch checked={marks} onCheckedChange={setMarks} />
                  Print guide lines along the edges that join
                </label>

                <p className="mt-3 max-w-[62ch] text-sm text-muted-foreground">
                  The overlap is a strip repeated on both of two adjoining sheets, so there is
                  something to trim to and no white gap where they meet. About 28 points — a
                  centimetre — is usually enough.
                </p>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" onClick={run}>
                <Expand aria-hidden="true" />
                Make the poster
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not make the poster" message={error} />}
    </WidgetStack>
  );
}
