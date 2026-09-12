"use client";

import { useState } from "react";
import { Info, Wrench } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { repairPdf, type RepairResult } from "@/lib/pdf/repair";
import { formatBytes, withSuffix } from "@/lib/utils";

export function RepairWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepairResult | null>(null);

  // The uploader is not used through useSinglePdf here: that hook opens the
  // document to count its pages, which is exactly what fails on a broken file.
  async function accept(files: File[]) {
    const chosen = files[0];
    if (!chosen) return;
    setFile(chosen);
    setError(null);
    setResult(null);
    setBusy(true);

    try {
      const bytes = new Uint8Array(await chosen.arrayBuffer());
      setResult(await repairPdf(bytes));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This file could not be repaired.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  if (result && file) {
    const fileName = withSuffix(file.name.replace(/\.[^.]+$/, ".pdf"), "repaired");
    return (
      <>
        <DownloadResult
          title="Recovered"
          fileName={fileName}
          stats={[
            { label: "Pages recovered", value: String(result.pages) },
            { label: "Size", value: formatBytes(result.bytes.byteLength) },
          ]}
          note="The document was written out from scratch rather than patched, so whatever else was broken has been left behind. Check the pages before relying on it."
          downloadLabel="Download repaired PDF"
          restartLabel="Try another file"
          onDownload={() => downloadBlob(toBlob(result.bytes), fileName)}
          onRestart={reset}
          onDelete={reset}
        />

        {result.notes.length > 0 && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-muted/60 p-5">
            <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <WidgetStack>
      {busy ? (
        <ProcessingProgress label="Looking at what can be salvaged" value={null} />
      ) : (
        <FileUploader
          extensions={["pdf"]}
          title="Drop the file that will not open"
          hint="or choose it from your device"
          buttonLabel="Choose the file"
          onFiles={accept}
        />
      )}

      <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-5">
        <Wrench className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">What this can and cannot do</p>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            A PDF ends with a table saying where everything in it lives. If a download was cut
            short or an editor crashed, that table is wrong and readers refuse the file — even
            though the pages are usually still there. This rebuilds it from what can be found.
            Where the page content itself is missing, nothing can bring it back.
          </p>
        </div>
      </div>

      {error && <ErrorNotice title="Could not repair this file" message={error} />}
    </WidgetStack>
  );
}
