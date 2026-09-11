"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";

/**
 * QR code generation.
 *
 * The encoding itself is done by the `qrcode` package rather than by hand:
 * the format involves Reed-Solomon error correction and eight candidate mask
 * patterns scored against penalty rules, and a subtly wrong implementation
 * produces codes that some scanners read and others do not.
 */

export type QrKind = "url" | "text" | "email" | "phone" | "sms" | "wifi";

/** How much of the code can be damaged and still scan. */
export type QrLevel = "L" | "M" | "Q" | "H";

export const QR_LEVELS: { value: QrLevel; label: string; hint: string }[] = [
  { value: "L", label: "Low", hint: "About 7% recoverable. Smallest code." },
  { value: "M", label: "Medium", hint: "About 15%. A sensible default." },
  { value: "Q", label: "High", hint: "About 25%. For codes that may get marked." },
  { value: "H", label: "Highest", hint: "About 30%. Survives a logo placed over it." },
];

export type WifiDetails = {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden: boolean;
};

/** Escapes the characters that carry meaning in a Wi-Fi payload. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,":])/g, "\\$1");
}

/**
 * Builds the string that actually goes into the code. Scanners recognise these
 * prefixes and offer to act on them — dial the number, join the network — so
 * the format matters more than it looks.
 */
export function buildPayload(
  kind: QrKind,
  value: string,
  extra: { subject?: string; body?: string; wifi?: WifiDetails } = {},
): string {
  switch (kind) {
    case "url": {
      const trimmed = value.trim();
      if (!trimmed) return "";
      // A bare domain scans as plain text and does nothing useful.
      return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }
    case "email":
      return `mailto:${value.trim()}${
        extra.subject || extra.body
          ? `?${new URLSearchParams({
              ...(extra.subject ? { subject: extra.subject } : {}),
              ...(extra.body ? { body: extra.body } : {}),
            }).toString()}`
          : ""
      }`;
    case "phone":
      return `tel:${value.replace(/\s+/g, "")}`;
    case "sms":
      return `sms:${value.replace(/\s+/g, "")}${extra.body ? `?body=${encodeURIComponent(extra.body)}` : ""}`;
    case "wifi": {
      const wifi = extra.wifi;
      if (!wifi?.ssid) return "";
      const parts = [
        `T:${wifi.security}`,
        `S:${escapeWifi(wifi.ssid)}`,
        wifi.security !== "nopass" ? `P:${escapeWifi(wifi.password)}` : "",
        wifi.hidden ? "H:true" : "",
      ].filter(Boolean);
      return `WIFI:${parts.join(";")};;`;
    }
    case "text":
    default:
      return value;
  }
}

export type QrOptions = {
  level: QrLevel;
  /** Pixel size of the produced image. */
  size: number;
  /** Quiet zone, in modules. Below 2 some scanners struggle. */
  margin: number;
  dark: string;
  light: string;
};

export async function qrToDataUrl(payload: string, options: QrOptions): Promise<string> {
  if (!payload.trim()) throw new PdfError("There is nothing to encode yet.");
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: options.level,
    width: options.size,
    margin: options.margin,
    color: { dark: options.dark, light: options.light },
  });
}

export async function qrToSvg(payload: string, options: QrOptions): Promise<string> {
  if (!payload.trim()) throw new PdfError("There is nothing to encode yet.");
  const QRCode = (await import("qrcode")).default;
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: options.level,
    margin: options.margin,
    color: { dark: options.dark, light: options.light },
  });
}

/** A single page holding the code, sized for printing and cutting out. */
export async function qrToPdf(
  payload: string,
  options: QrOptions,
  caption?: string,
): Promise<Uint8Array> {
  const dataUrl = await qrToDataUrl(payload, { ...options, size: 2048 });
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(dataUrl);

  const side = 260; // points, roughly 9cm — comfortable to scan from a page
  const page = doc.addPage([side + 96, side + (caption ? 150 : 96)]);

  page.drawImage(image, {
    x: 48,
    y: page.getHeight() - side - 48,
    width: side,
    height: side,
  });

  if (caption) {
    // Drawn through a canvas so any script survives; pdf-lib's built-in fonts
    // would turn Cyrillic into blanks.
    const canvas = document.createElement("canvas");
    canvas.width = side * 3;
    canvas.height = 150;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = options.light;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#111827";
      context.font = `${34}px "Segoe UI", Arial, "Noto Sans", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(caption, canvas.width / 2, canvas.height / 2, canvas.width - 40);
      const text = await doc.embedJpg(canvas.toDataURL("image/jpeg", 0.95));
      page.drawImage(text, { x: 48, y: 30, width: side, height: 50 });
    }
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}
