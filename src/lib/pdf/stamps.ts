"use client";

import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { FONT_STACK } from "@/lib/pdf/paper";
import type { PDFDocument } from "pdf-lib";

/**
 * Running headers and footers.
 *
 * Text is drawn through a canvas for the same reason as everywhere else in
 * this project: pdf-lib's built-in fonts cannot represent Cyrillic or Arabic,
 * and a document title in Russian would come out blank.
 */

export type StampSlot = "left" | "center" | "right";

export type StampText = {
  header: Record<StampSlot, string>;
  footer: Record<StampSlot, string>;
};

export type StampOptions = {
  size: number;
  /** Distance from the edge of the page, in points. */
  margin: number;
  colour: string;
  skipFirst: boolean;
};

export const EMPTY_STAMPS: StampText = {
  header: { left: "", center: "", right: "" },
  footer: { left: "", center: "", right: "" },
};

/**
 * Placeholders, so one entry can serve a whole document.
 *
 *   {page}  the page number
 *   {total} how many pages there are
 *   {date}  today, in the reader's own format
 *   {file}  the file name without its extension
 */
export function expand(
  template: string,
  values: { page: number; total: number; file: string },
): string {
  return template
    .replace(/\{page\}/g, String(values.page))
    .replace(/\{total\}/g, String(values.total))
    .replace(/\{date\}/g, new Date().toLocaleDateString())
    .replace(/\{file\}/g, values.file);
}

async function draw(
  doc: PDFDocument,
  text: string,
  size: number,
  colour: string,
): Promise<{ image: Awaited<ReturnType<PDFDocument["embedPng"]>>; width: number; height: number }> {
  const scale = 4;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new PdfError("Your browser could not lay out the text.");
  measure.font = `${size * scale}px ${FONT_STACK}`;

  const width = Math.ceil(measure.measureText(text).width) + 8;
  const height = Math.ceil(size * scale * 1.45);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PdfError("Your browser could not draw the text.");
  context.font = `${size * scale}px ${FONT_STACK}`;
  context.fillStyle = colour;
  context.textBaseline = "middle";
  context.fillText(text, 4, height / 2);

  return {
    image: await doc.embedPng(canvas.toDataURL("image/png")),
    width: width / scale,
    height: height / scale,
  };
}

export async function addStamps(
  bytes: Uint8Array,
  stamps: StampText,
  options: StampOptions,
  fileName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const entries = [
    ...(["left", "center", "right"] as StampSlot[]).map((slot) => ({
      slot,
      where: "header" as const,
      template: stamps.header[slot],
    })),
    ...(["left", "center", "right"] as StampSlot[]).map((slot) => ({
      slot,
      where: "footer" as const,
      template: stamps.footer[slot],
    })),
  ].filter((entry) => entry.template.trim());

  if (entries.length === 0) {
    throw new PdfError("Write something in at least one of the six positions first.");
  }

  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const base = fileName.replace(/\.[^.]+$/, "");

  for (const [index, page] of pages.entries()) {
    if (options.skipFirst && index === 0) {
      onProgress?.(index + 1, pages.length);
      continue;
    }

    for (const entry of entries) {
      const text = expand(entry.template, {
        page: index + 1,
        total: pages.length,
        file: base,
      });
      const { image, width, height } = await draw(doc, text, options.size, options.colour);

      const pageWidth = page.getWidth();
      const x =
        entry.slot === "left"
          ? options.margin
          : entry.slot === "right"
            ? pageWidth - options.margin - width
            : (pageWidth - width) / 2;
      const y =
        entry.where === "header"
          ? page.getHeight() - options.margin - height
          : options.margin;

      page.drawImage(image, { x, y, width, height });
    }

    onProgress?.(index + 1, pages.length);
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}
