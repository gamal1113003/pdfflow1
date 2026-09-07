"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";

/**
 * Translating a PDF has an unavoidable trade-off. The original file stores
 * glyph positions, not sentences, and a translation is a different length from
 * the source — Russian runs about 15% longer than English. Dropping translated
 * text back into the original boxes overflows every line.
 *
 * So this produces a clean, readable text document instead of a visual copy:
 * one output page per source page, text reflowed to fit. The original stays
 * untouched on your device.
 *
 * Text is drawn through the browser's own font engine and embedded as an
 * image, which is what makes Cyrillic, Arabic and CJK work without shipping a
 * font file. The trade-off is that the result is not selectable text.
 */

export type TranslateProgress = (stage: string, fraction: number) => void;

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const SCALE = 2;

const FONT_STACK =
  '"Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Arabic", system-ui, sans-serif';

/** Pulls the readable text out of each page, one string per page. */
export async function extractPageText(
  bytes: Uint8Array,
  onProgress?: TranslateProgress,
): Promise<string[]> {
  const doc = await openDocument(bytes);
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();

      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += item.str;
        // pdf.js marks the end of a visual line.
        text += item.hasEOL ? "\n" : " ";
      }

      pages.push(text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
      page.cleanup();
      onProgress?.("Reading the document", pageNumber / doc.numPages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return pages;
  } finally {
    await doc.destroy();
  }
}

export async function translatePages(
  pages: string[],
  target: string,
  onProgress?: TranslateProgress,
): Promise<string[]> {
  const output: string[] = [];

  // One request per page keeps each payload small and lets progress advance.
  for (const [index, text] of pages.entries()) {
    if (!text.trim()) {
      output.push("");
      continue;
    }

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [text], target }),
    });

    if (response.status === 501) {
      const body = (await response.json()) as { error?: string };
      throw new PdfError(body.error ?? "Translation is not configured on this deployment.");
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new PdfError(body.error ?? "The translation service could not process this text.");
    }

    const body = (await response.json()) as { translations: string[] };
    output.push(body.translations[0] ?? "");
    onProgress?.("Translating", (index + 1) / pages.length);
  }

  return output;
}

function wrapLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

/** Lays the translated text out as a new PDF, adding pages as needed. */
export async function buildTranslatedPdf(
  translated: string[],
  onProgress?: TranslateProgress,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontSize = 11.5;
  const lineHeight = fontSize * 1.55;
  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  const linesPerPage = Math.floor((PAGE_HEIGHT - MARGIN * 2) / lineHeight);

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new PdfError("Your browser could not lay out the text.");
  measure.font = `${fontSize * SCALE}px ${FONT_STACK}`;

  for (const [index, text] of translated.entries()) {
    const lines = text.trim()
      ? wrapLines(measure, text, usableWidth * SCALE)
      : ["(no text on this page)"];

    for (let start = 0; start < lines.length; start += linesPerPage) {
      const slice = lines.slice(start, start + linesPerPage);

      const canvas = document.createElement("canvas");
      canvas.width = PAGE_WIDTH * SCALE;
      canvas.height = PAGE_HEIGHT * SCALE;
      const context = canvas.getContext("2d");
      if (!context) throw new PdfError("Your browser could not draw the page.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#111827";
      context.font = `${fontSize * SCALE}px ${FONT_STACK}`;
      context.textBaseline = "top";

      slice.forEach((line, row) => {
        context.fillText(line, MARGIN * SCALE, (MARGIN + row * lineHeight) * SCALE);
      });

      const image = await doc.embedJpg(canvas.toDataURL("image/jpeg", 0.92));
      const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
    }

    onProgress?.("Building the PDF", (index + 1) / translated.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (doc.getPageCount() === 0) {
    throw new PdfError("No readable text was found. Scanned pages need OCR first.");
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}
