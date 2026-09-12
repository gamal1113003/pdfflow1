"use client";

import { useEffect, useState } from "react";
import { Eraser, Tags } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { readMetadata, writeMetadata, type Metadata } from "@/lib/pdf/extras";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

const EMPTY: Metadata = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  created: null,
  modified: null,
};

const FIELDS: { key: keyof Metadata; label: string; hint?: string }[] = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author", hint: "Often your real name, put there by the software that made the file." },
  { key: "subject", label: "Subject" },
  { key: "keywords", label: "Keywords", hint: "Separate with commas." },
  { key: "creator", label: "Created with", hint: "The program the document was written in." },
  { key: "producer", label: "Produced by", hint: "The program that wrote the PDF." },
];

export function MetadataWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [original, setOriginal] = useState<Metadata | null>(null);
  const [draft, setDraft] = useState<Metadata>(EMPTY);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pdf) {
      setOriginal(null);
      return;
    }
    readMetadata(pdf.bytes)
      .then((metadata) => {
        setOriginal(metadata);
        setDraft(metadata);
      })
      .catch(() => setError("The details of this document could not be read."));
  }, [pdf, setError]);

  async function save(clearEverything: boolean) {
    if (!pdf) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await writeMetadata(pdf.bytes, clearEverything ? EMPTY : draft, clearEverything),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The details could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setOriginal(null);
    setDraft(EMPTY);
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "cleaned");
    return (
      <DownloadResult
        title="Your document is ready"
        fileName={fileName}
        stats={[
          { label: "Pages", value: String(pdf.pageCount) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="This rewrites the details every reader displays. A file that has been through several editors may also carry XMP metadata, which this cannot reach — for something genuinely sensitive, Blacken PDF rebuilds the pages and leaves nothing behind."
        downloadLabel="Download"
        restartLabel="Edit another document"
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

          {original && (
            <>
              <SettingsPanel
                title="What this document says about itself"
                description="Every field below travels with the file and is visible to anyone who opens its properties."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        value={(draft[field.key] as string) ?? ""}
                        placeholder="—"
                        onChange={(event) =>
                          setDraft({ ...draft, [field.key]: event.target.value })
                        }
                      />
                      {field.hint && (
                        <p className="text-xs text-muted-foreground">{field.hint}</p>
                      )}
                    </div>
                  ))}
                </div>

                {(original.created || original.modified) && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Dates recorded: created {original.created ?? "—"}, last modified{" "}
                    {original.modified ?? "—"}. Removing everything also clears these.
                  </p>
                )}
              </SettingsPanel>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" disabled={busy} onClick={() => save(false)}>
                  <Tags aria-hidden="true" />
                  Save these details
                </Button>
                <Button size="lg" variant="secondary" disabled={busy} onClick={() => save(true)}>
                  <Eraser aria-hidden="true" />
                  Remove everything
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not read the document details" message={error} />}
    </WidgetStack>
  );
}
