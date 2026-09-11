"use client";

import { useState } from "react";
import { Briefcase, Paperclip, X } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { buildApplicationPdf } from "@/lib/pdf/application";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatBytes, moveItem, uid } from "@/lib/utils";

type Attachment = { id: string; file: File };

export function ApplicationWidget() {
  const { language } = useLanguage();
  const locale = language === "ru" ? "ru" : "en";

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [letter, setLetter] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  async function run() {
    if (!fullName.trim()) {
      setError("Add your name — the letter is signed with it.");
      return;
    }
    if (!letter.trim()) {
      setError("Write the letter before creating the document.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(attachments.length > 0 ? { done: 0, total: attachments.length } : null);

    try {
      setResult(
        await buildApplicationPdf(
          {
            fullName,
            address,
            phone,
            email,
            position,
            company,
            companyAddress,
            date,
            reference,
            letter,
            language: locale,
          },
          attachments.map((entry) => entry.file),
          (done, total) => setProgress({ done, total }),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The application could not be created.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  if (result) {
    const fileName = `application-${(position || fullName).toLowerCase().replace(/[^\w]+/g, "-")}.pdf`;
    return (
      <DownloadResult
        title="Your application is ready"
        fileName={fileName}
        stats={[
          { label: "Attachments", value: String(attachments.length) },
          { label: "Position", value: position || "—" },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="The covering letter comes first, then your attachments in the order you arranged them — one file to send."
        downloadLabel="Download application"
        restartLabel="Create another"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={() => setResult(null)}
      />
    );
  }

  return (
    <WidgetStack>
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsPanel title="You" description="Shown at the top of the letter and used to sign it.">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </SettingsPanel>

        <SettingsPanel title="The role" description="Who you are writing to, and about what.">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Company address</Label>
              <textarea
                id="company-address"
                rows={2}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  placeholder="Job ID, advert number"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>
        </SettingsPanel>
      </div>

      <SettingsPanel
        title="Covering letter"
        description="Write it as you would on paper. Blank lines separate paragraphs."
      >
        <textarea
          rows={12}
          value={letter}
          onChange={(event) => setLetter(event.target.value)}
          placeholder={"Dear Sir or Madam,\n\nI am writing to apply for…"}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-3 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </SettingsPanel>

      <SettingsPanel
        title="Attachments"
        description="CV, certificates, references. They are converted to PDF and placed behind the letter, in this order."
      >
        <FileUploader
          extensions={ACCEPTED_INPUT}
          multiple
          size="sm"
          title="Add your documents"
          hint="CV, certificates, references"
          buttonLabel="Choose files"
          onFiles={(files) =>
            setAttachments((current) => [
              ...current,
              ...files.map((file) => ({ id: uid(), file })),
            ])
          }
        />

        {attachments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {attachments.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm">{entry.file.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatBytes(entry.file.size)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => setAttachments((c) => moveItem(c, index, index - 1))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} up</span>↑
                  </button>
                  <button
                    type="button"
                    disabled={index === attachments.length - 1}
                    onClick={() => setAttachments((c) => moveItem(c, index, index + 1))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <span className="sr-only">Move {entry.file.name} down</span>↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachments((c) => c.filter((a) => a.id !== entry.id))}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                  >
                    <span className="sr-only">Remove {entry.file.name}</span>
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsPanel>

      {busy ? (
        <ProcessingProgress
          label="Building your application"
          value={progress ? (progress.done / Math.max(progress.total, 1)) * 100 : null}
          detail={progress ? `Adding attachment ${progress.done} of ${progress.total}` : undefined}
        />
      ) : (
        <Button size="lg" className="w-full sm:w-auto" onClick={run}>
          <Briefcase aria-hidden="true" />
          Create application
        </Button>
      )}

      {error && <ErrorNotice title="Could not create the application" message={error} />}
    </WidgetStack>
  );
}
