"use client";

import { useState } from "react";
import { ServerCog, ShieldAlert } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice, InfoNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import {
  isServiceConfigured,
  runServiceJob,
  ServiceUnavailableError,
  type ServiceJob,
} from "@/lib/services/pdfService";
import { downloadBlob } from "@/lib/pdf/download";
import { ACCEPTED_INPUT, ingestAsPdf, needsConversion } from "@/lib/pdf/ingest";
import { toBlob } from "@/lib/pdf/document";
import type { Tool } from "@/lib/tools";
import { formatBytes } from "@/lib/utils";

type Fields = "set-password" | "enter-password" | undefined;

/**
 * Frontend for the jobs that need a server: Office conversion, OCR and
 * PDF encryption. The upload, validation, options and result flow are all
 * real — only the conversion itself is delegated to `pdfService`.
 */
export function BackendWidget({ tool }: { tool: Tool }) {
  const acceptedFormats = (tool.config?.accept as string[] | undefined) ?? ["pdf"];
  // A tool whose input is a PDF can also take the formats we can convert to
  // one. A tool whose input is a Word file keeps its own narrower list.
  const takesPdf = acceptedFormats.length === 1 && acceptedFormats[0] === "pdf";
  const extensions = takesPdf ? ACCEPTED_INPUT : acceptedFormats;
  const fields = tool.config?.fields as Fields;
  const outputLabel = (tool.config?.outputLabel as string | undefined) ?? "Converted file";

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

  const configured = isServiceConfigured();

  function validate(): string | null {
    if (!file) return "Choose a file first.";
    if (fields === "set-password") {
      if (password.length < 6) return "Use a password of at least 6 characters.";
      if (password !== confirmPassword) return "The two passwords do not match.";
    }
    if (fields === "enter-password" && password.length === 0) {
      return "Enter the password for this document.";
    }
    return null;
  }

  async function run() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!file) return;

    setBusy(true);
    setError(null);
    setUnavailable(false);
    try {
      // Convert first where the tool expects a PDF and the upload is not one.
      let toSend = file;
      if (takesPdf && needsConversion(file)) {
        const ingested = await ingestAsPdf(file);
        toSend = new File([toBlob(ingested.bytes)], ingested.fileName, {
          type: "application/pdf",
        });
      }

      const output = await runServiceJob(
        tool.slug as ServiceJob,
        toSend,
        fields ? { password } : {},
      );
      setResult(output);
    } catch (cause) {
      if (cause instanceof ServiceUnavailableError) {
        setUnavailable(true);
        setDetail(cause.message);
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : "Something went wrong while processing your file. Please try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setUnavailable(false);
    setDetail(null);
    setPassword("");
    setConfirmPassword("");
  }

  if (result) {
    return (
      <DownloadResult
        title="Your file is ready"
        fileName={result.fileName}
        stats={[
          { label: "Output", value: outputLabel },
          { label: "Size", value: formatBytes(result.blob.size) },
          { label: "Source", value: file?.name ?? "—" },
        ]}
        downloadLabel="Download file"
        restartLabel="Convert another file"
        onDownload={() => downloadBlob(result.blob, result.fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  return (
    <WidgetStack>
      {!file ? (
        <FileUploader
          extensions={extensions}
          title={`Drop your ${extensions[0].toUpperCase()} here`}
          hint="or choose a file from your device"
          buttonLabel={`Choose ${extensions[0].toUpperCase()}`}
          onFiles={(files) => {
            setFile(files[0]);
            setError(null);
          }}
        />
      ) : (
        <>
          <FileSummary
            fileName={file.name}
            size={file.size}
            onRemove={busy ? undefined : reset}
          />

          {fields === "set-password" && (
            <SettingsPanel
              title="Choose a password"
              description="Anyone who opens this document will need it. There is no way to recover it."
            >
              <div className="grid max-w-md gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>
            </SettingsPanel>
          )}

          {fields === "enter-password" && (
            <>
              <SettingsPanel title="Document password">
                <div className="max-w-md space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="off"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </SettingsPanel>
              <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-5">
                <ShieldAlert
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  Only remove protection from documents you own or are authorised to modify.
                  Removing a password from someone else&apos;s document may be unlawful.
                </p>
              </div>
            </>
          )}

          {busy ? (
            <ProcessingProgress
              label="Processing your file"
              value={null}
              detail="Working with the conversion service."
            />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              {tool.name}
            </Button>
          )}
        </>
      )}

      {(unavailable || !configured) && (
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ServerCog className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              This one runs on a server
            </h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {detail ??
                `${tool.name} needs processing that a browser tab cannot do accurately — the layout engine and font handling live on the server. This build has no conversion service connected, so the job stops here rather than returning a low-quality result.`}
            </p>
            <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              Set <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_PDF_API_URL</code> to
              your service and this tool starts working, using the same upload and download flow
              you see here. The contract is in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">lib/services/pdfService.ts</code>.
            </p>
          </div>
        </div>
      )}

      {!configured && !file && (
        <InfoNotice title="Everything else still works">
          Merging, splitting, rotating, compressing, watermarking, signing and image conversion all
          run in your browser with no server at all.
        </InfoNotice>
      )}

      {error && <ErrorNotice title="Could not process the file" message={error} />}
    </WidgetStack>
  );
}
