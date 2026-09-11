"use client";

import { useEffect, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { ErrorNotice } from "@/components/pdf/Notices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import {
  buildPayload,
  QR_LEVELS,
  qrToDataUrl,
  qrToPdf,
  qrToSvg,
  type QrKind,
  type QrLevel,
  type WifiDetails,
} from "@/lib/pdf/qrcode";
import { cn } from "@/lib/utils";

const KINDS: { value: QrKind; label: string }[] = [
  { value: "url", label: "Website" },
  { value: "text", label: "Plain text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "Text message" },
  { value: "wifi", label: "Wi-Fi network" },
];

const COLOURS = [
  { dark: "#111827", light: "#ffffff", label: "Black" },
  { dark: "#5b45e0", light: "#ffffff", label: "Violet" },
  { dark: "#0f9d66", light: "#ffffff", label: "Green" },
  { dark: "#b91c1c", light: "#ffffff", label: "Red" },
  { dark: "#ffffff", light: "#111827", label: "Inverted" },
];

export function QrWidget() {
  const [kind, setKind] = useState<QrKind>("url");
  const [value, setValue] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [wifi, setWifi] = useState<WifiDetails>({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  });

  const [level, setLevel] = useState<QrLevel>("M");
  const [colour, setColour] = useState(COLOURS[0]);
  const [caption, setCaption] = useState("");

  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = buildPayload(kind, value, { subject, body, wifi });
  const options = { level, size: 512, margin: 2, dark: colour.dark, light: colour.light };

  // Redrawn as the settings change, so the code on screen is always the one
  // that will be downloaded.
  useEffect(() => {
    let cancelled = false;
    if (!payload.trim()) {
      setPreview(null);
      return;
    }
    qrToDataUrl(payload, options)
      .then((url) => {
        if (!cancelled) {
          setPreview(url);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setPreview(null);
          setError(
            cause instanceof Error && /too (long|big)/i.test(cause.message)
              ? "That is more than a QR code can hold. Shorten the text, or link to it instead."
              : "This could not be encoded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, level, colour.dark, colour.light]);

  async function download(format: "png" | "svg" | "pdf") {
    try {
      const stem = "qr-code";
      if (format === "png") {
        const url = await qrToDataUrl(payload, { ...options, size: 2048 });
        downloadBlob(await (await fetch(url)).blob(), `${stem}.png`);
      } else if (format === "svg") {
        const svg = await qrToSvg(payload, options);
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${stem}.svg`);
      } else {
        const bytes = await qrToPdf(payload, options, caption.trim() || undefined);
        downloadBlob(toBlob(bytes), `${stem}.pdf`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The download failed.");
    }
  }

  return (
    <WidgetStack>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <SettingsPanel title="What should it contain?">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kind">Type</Label>
                <NativeSelect
                  id="kind"
                  value={kind}
                  onChange={(next) => setKind(next as QrKind)}
                  options={KINDS}
                />
              </div>

              {kind === "wifi" ? (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssid">Network name</Label>
                    <Input
                      id="ssid"
                      value={wifi.ssid}
                      onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="security">Security</Label>
                      <NativeSelect
                        id="security"
                        value={wifi.security}
                        onChange={(next) =>
                          setWifi({ ...wifi, security: next as WifiDetails["security"] })
                        }
                        options={[
                          { value: "WPA", label: "WPA / WPA2" },
                          { value: "WEP", label: "WEP" },
                          { value: "nopass", label: "Open, no password" },
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifi-password">Password</Label>
                      <Input
                        id="wifi-password"
                        value={wifi.password}
                        disabled={wifi.security === "nopass"}
                        onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <Switch
                      checked={wifi.hidden}
                      onCheckedChange={(checked) => setWifi({ ...wifi, hidden: checked })}
                    />
                    Hidden network
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Anyone who can see this code can join the network. Print it for guests, not for
                    a public wall.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {kind === "url"
                      ? "Address"
                      : kind === "email"
                        ? "Email address"
                        : kind === "phone" || kind === "sms"
                          ? "Phone number"
                          : "Text"}
                  </Label>
                  {kind === "text" ? (
                    <textarea
                      id="value"
                      rows={4}
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  ) : (
                    <Input
                      id="value"
                      value={value}
                      placeholder={kind === "url" ? "orzix.vercel.app" : undefined}
                      onChange={(event) => setValue(event.target.value)}
                    />
                  )}
                  {kind === "url" && (
                    <p className="text-sm text-muted-foreground">
                      https:// is added if you leave it off — without it the code scans as plain
                      text and does nothing.
                    </p>
                  )}
                </div>
              )}

              {(kind === "email" || kind === "sms") && (
                <div className="grid gap-4">
                  {kind === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <textarea
                      id="body"
                      rows={3}
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingsPanel>

          <SettingsPanel title="Appearance">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="level">Error correction</Label>
                <NativeSelect
                  id="level"
                  value={level}
                  onChange={(next) => setLevel(next as QrLevel)}
                  options={QR_LEVELS.map((entry) => ({
                    value: entry.value,
                    label: `${entry.label} — ${entry.hint}`,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Colour</span>
                <div className="flex flex-wrap gap-2">
                  {COLOURS.map((entry) => (
                    <button
                      key={entry.label}
                      type="button"
                      onClick={() => setColour(entry)}
                      aria-pressed={colour.label === entry.label}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                        colour.label === entry.label
                          ? "border-primary bg-primary-soft/60"
                          : "border-border hover:border-foreground/20",
                      )}
                    >
                      <span
                        className="size-4 rounded border border-border"
                        style={{ background: entry.dark }}
                      />
                      {entry.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep a strong contrast between the code and its background, or scanners will
                  struggle.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption on the PDF</Label>
                <Input
                  id="caption"
                  value={caption}
                  placeholder="Scan to pay"
                  onChange={(event) => setCaption(event.target.value)}
                />
              </div>
            </div>
          </SettingsPanel>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div
              className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-border"
              style={{ background: colour.light }}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="QR code preview" className="size-full object-contain" />
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <QrCode className="mx-auto mb-3 size-8 opacity-40" aria-hidden="true" />
                  Fill in the details and the code appears here.
                </div>
              )}
            </div>

            {payload && (
              <p className="mt-4 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                {payload}
              </p>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button disabled={!preview} onClick={() => download("png")}>
                <Download aria-hidden="true" />
                PNG
              </Button>
              <Button variant="secondary" disabled={!preview} onClick={() => download("svg")}>
                <Download aria-hidden="true" />
                SVG
              </Button>
              <Button variant="secondary" disabled={!preview} onClick={() => download("pdf")}>
                <Download aria-hidden="true" />
                PDF
              </Button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              SVG stays sharp at any size, so use it for print. To put the code on an existing
              document, download the PNG and add it with Sign PDF or the page editor.
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorNotice title="Could not create the code" message={error} />}
    </WidgetStack>
  );
}
