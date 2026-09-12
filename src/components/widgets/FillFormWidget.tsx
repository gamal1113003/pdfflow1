"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, PenLine } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { fillForm, readForm, unsupportedCharacters, type FormField } from "@/lib/pdf/forms";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { formatBytes, withSuffix } from "@/lib/utils";

export function FillFormWidget() {
  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!pdf) {
      setFields(null);
      return;
    }
    readForm(pdf.bytes)
      .then((found) => {
        setFields(found);
        setValues(Object.fromEntries(found.map((field) => [field.name, field.value])));
        setError(null);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "The form could not be read."),
      );
  }, [pdf, setError]);

  async function run() {
    if (!pdf) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await fillForm(pdf.bytes, values, flatten));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The form could not be filled.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setFields(null);
    setValues({});
    clear();
  }

  const troublesome = unsupportedCharacters(values);

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, "filled");
    return (
      <DownloadResult
        title="Your filled form is ready"
        fileName={fileName}
        stats={[
          { label: "Fields filled", value: String(Object.values(values).filter(Boolean).length) },
          { label: flatten ? "Locked" : "Still editable", value: flatten ? "Yes" : "Yes" },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note={
          flatten
            ? "The values are now part of the page and can no longer be changed."
            : "The values are stored in the form fields, so they stay editable and any system reading the form can find them."
        }
        downloadLabel="Download filled form"
        restartLabel="Fill another form"
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

          {fields && (
            <>
              <SettingsPanel
                title={`${fields.length} ${fields.length === 1 ? "field" : "fields"} found`}
                description="These are the document's own form fields, so what you type is stored in the form rather than drawn on top of it."
              >
                <div className="grid gap-5">
                  {fields.map((field) => {
                    const id = `field-${field.name}`;
                    if (field.kind === "checkbox") {
                      return (
                        <label key={field.name} className="flex items-center gap-3 text-sm">
                          <Switch
                            checked={Boolean(values[field.name])}
                            disabled={field.readOnly}
                            onCheckedChange={(checked) =>
                              setValues({ ...values, [field.name]: checked ? "on" : "" })
                            }
                          />
                          {field.name}
                        </label>
                      );
                    }

                    if (field.options && field.options.length > 0) {
                      return (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={id}>{field.name}</Label>
                          <NativeSelect
                            id={id}
                            value={values[field.name] ?? ""}
                            onChange={(next) => setValues({ ...values, [field.name]: next })}
                            options={[
                              { value: "", label: "— not set —" },
                              ...field.options.map((option) => ({ value: option, label: option })),
                            ]}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={id}>
                          {field.name}
                          {field.readOnly && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              read only
                            </span>
                          )}
                        </Label>
                        {field.multiline ? (
                          <textarea
                            id={id}
                            rows={3}
                            disabled={field.readOnly}
                            maxLength={field.maxLength}
                            value={values[field.name] ?? ""}
                            onChange={(event) =>
                              setValues({ ...values, [field.name]: event.target.value })
                            }
                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
                          />
                        ) : (
                          <Input
                            id={id}
                            disabled={field.readOnly}
                            maxLength={field.maxLength}
                            value={values[field.name] ?? ""}
                            onChange={(event) =>
                              setValues({ ...values, [field.name]: event.target.value })
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </SettingsPanel>

              {troublesome.length > 0 && (
                <div className="flex gap-3 rounded-2xl border border-border bg-muted/60 p-5">
                  <AlertTriangle
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-medium">Some characters may not appear</p>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                      {troublesome.join(", ")} contains letters outside the Latin alphabet. A form
                      field can only draw them if the document carries a font that includes them,
                      and most do not — the values will be stored correctly but may look blank when
                      opened. Annotate PDF writes text as part of the page instead, and handles any
                      alphabet.
                    </p>
                  </div>
                </div>
              )}

              <SettingsPanel
                title="Lock the values in?"
                description="Flattening turns the filled fields into ordinary page content. Nobody can change them afterwards, and it looks identical in every reader."
              >
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={flatten} onCheckedChange={setFlatten} />
                  Lock the form after filling
                </label>
              </SettingsPanel>

              <Button size="lg" className="w-full sm:w-auto" disabled={busy} onClick={run}>
                <PenLine aria-hidden="true" />
                Fill the form
              </Button>
            </>
          )}
        </>
      )}

      {error && <ErrorNotice title="Could not use this form" message={error} />}
    </WidgetStack>
  );
}
