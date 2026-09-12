"use client";

import { PDFDocument, degrees } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";
import { FONT_STACK } from "@/lib/pdf/paper";

/** ---------------------------------------------------------------
 *  Page numbers
 *  ------------------------------------------------------------- */

export type NumberPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";

export type PageNumberOptions = {
  position: NumberPosition;
  /** Number to print on the first page. */
  startAt: number;
  /** Pages before this one are left blank — useful for a cover. */
  skipFirst: number;
  size: number;
  /** "1", "1 / 12", "Page 1 of 12" */
  format: "plain" | "slash" | "words";
  wordsLabel: string;
  wordsJoiner: string;
};

/**
 * Numbers are drawn through a canvas rather than with pdf-lib's fonts.
 *
 * pdf-lib can only embed the standard 14 fonts without a font file, and those
 * are Latin-only — so "Страница 3 из 12" would come out as blanks. Rendering
 * the label as a small image costs a little sharpness at extreme zoom and
 * makes every language work.
 */
async function labelImage(
  doc: PDFDocument,
  text: string,
  size: number,
): Promise<{ image: Awaited<ReturnType<PDFDocument["embedPng"]>>; width: number; height: number }> {
  const scale = 4;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new PdfError("Your browser could not lay out the text.");
  measure.font = `${size * scale}px ${FONT_STACK}`;
  const width = Math.ceil(measure.measureText(text).width) + 8;
  const height = Math.ceil(size * scale * 1.4);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PdfError("Your browser could not draw the text.");
  context.font = `${size * scale}px ${FONT_STACK}`;
  context.fillStyle = "#111827";
  context.textBaseline = "middle";
  context.fillText(text, 4, height / 2);

  return {
    image: await doc.embedPng(canvas.toDataURL("image/png")),
    width: width / scale,
    height: height / scale,
  };
}

export async function addPageNumbers(
  bytes: Uint8Array,
  options: PageNumberOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const total = pages.length;
  const margin = 28;

  for (const [index, page] of pages.entries()) {
    if (index < options.skipFirst) {
      onProgress?.(index + 1, total);
      continue;
    }

    const number = options.startAt + index - options.skipFirst;
    const shown = total - options.skipFirst;
    const text =
      options.format === "plain"
        ? String(number)
        : options.format === "slash"
          ? `${number} / ${shown}`
          : `${options.wordsLabel} ${number} ${options.wordsJoiner} ${shown}`;

    const { image, width, height } = await labelImage(doc, text, options.size);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const x =
      options.position.endsWith("left")
        ? margin
        : options.position.endsWith("right")
          ? pageWidth - margin - width
          : (pageWidth - width) / 2;
    const y = options.position.startsWith("top")
      ? pageHeight - margin - height
      : margin;

    page.drawImage(image, { x, y, width, height });
    onProgress?.(index + 1, total);
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}

/** ---------------------------------------------------------------
 *  PDF to text
 *  ------------------------------------------------------------- */

export async function pdfToText(
  bytes: Uint8Array,
  onProgress?: (done: number, total: number) => void,
): Promise<{ text: string; emptyPages: number }> {
  const doc = await openDocument(bytes);
  try {
    const parts: string[] = [];
    let emptyPages = 0;

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();

      // Items carry position, so a line break can be inferred from a change in
      // vertical offset. Joining everything with spaces instead would turn the
      // document into one unreadable paragraph.
      let text = "";
      let lastY: number | null = null;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
        text += item.str;
        lastY = y;
      }

      page.cleanup();
      const trimmed = text.trim();
      if (!trimmed) emptyPages++;
      parts.push(trimmed);
      onProgress?.(pageNumber, doc.numPages);
    }

    if (parts.every((part) => !part)) {
      throw new PdfError(
        "There is no text in this document — the pages are images. Run it through OCR first, then the text can be extracted.",
      );
    }

    return {
      text: parts.map((part, index) => `--- ${index + 1} ---\n\n${part}`).join("\n\n"),
      emptyPages,
    };
  } finally {
    await doc.destroy();
  }
}

/** ---------------------------------------------------------------
 *  Extract embedded images
 *  ------------------------------------------------------------- */

export type ExtractedImage = { name: string; blob: Blob; width: number; height: number };

/**
 * Pulls out the images stored inside the document, rather than re-rendering
 * pages. What comes out is the original picture at its original resolution —
 * which for a scanned document is the scan itself.
 */
export async function extractImages(
  bytes: Uint8Array,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedImage[]> {
  const doc = await openDocument(bytes);
  const found: ExtractedImage[] = [];
  const seen = new Set<string>();

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const operators = await page.getOperatorList();

      for (let i = 0; i < operators.fnArray.length; i++) {
        // 85 is paintImageXObject in PDF.js's operator table.
        if (operators.fnArray[i] !== 85) continue;
        const name = operators.argsArray[i]?.[0];
        if (typeof name !== "string" || seen.has(`${pageNumber}:${name}`)) continue;
        seen.add(`${pageNumber}:${name}`);

        try {
          const object = await new Promise<{
            width: number;
            height: number;
            data?: Uint8ClampedArray;
            bitmap?: ImageBitmap;
          }>((resolve, reject) => {
            page.objs.get(name, resolve);
            setTimeout(() => reject(new Error("timed out")), 15000);
          });

          const canvas = document.createElement("canvas");
          canvas.width = object.width;
          canvas.height = object.height;
          const context = canvas.getContext("2d");
          if (!context) continue;

          if (object.bitmap) {
            context.drawImage(object.bitmap, 0, 0);
          } else if (object.data) {
            // PDF.js hands back three or four bytes per pixel depending on
            // whether the image has transparency.
            const channels = object.data.length / (object.width * object.height);
            const rgba = context.createImageData(object.width, object.height);
            for (let p = 0; p < object.width * object.height; p++) {
              rgba.data[p * 4] = object.data[p * channels];
              rgba.data[p * 4 + 1] = object.data[p * channels + 1];
              rgba.data[p * 4 + 2] = object.data[p * channels + 2];
              rgba.data[p * 4 + 3] = channels === 4 ? object.data[p * channels + 3] : 255;
            }
            context.putImageData(rgba, 0, 0);
          } else {
            continue;
          }

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png"),
          );
          if (!blob) continue;

          found.push({
            name: `page-${pageNumber}-image-${found.length + 1}.png`,
            blob,
            width: object.width,
            height: object.height,
          });
        } catch {
          // An image that cannot be decoded is skipped rather than failing the
          // whole extraction.
        }
      }

      page.cleanup();
      onProgress?.(pageNumber, doc.numPages);
    }

    if (found.length === 0) {
      throw new PdfError(
        "No embedded images were found. A page that looks like a picture may be drawn with vector graphics instead — try PDF to JPG, which renders the pages.",
      );
    }

    return found;
  } finally {
    await doc.destroy();
  }
}

/** ---------------------------------------------------------------
 *  Pages per sheet
 *  ------------------------------------------------------------- */

export async function pagesPerSheet(
  bytes: Uint8Array,
  perSheet: 2 | 4 | 6 | 9,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const source = await loadPdf(bytes);
  const output = await PDFDocument.create();
  const count = source.getPageCount();

  const grid: Record<number, [number, number]> = {
    2: [1, 2],
    4: [2, 2],
    6: [2, 3],
    9: [3, 3],
  };
  const [columns, rows] = grid[perSheet];

  // A4, turned sideways when the pages sit two across.
  const sheet: [number, number] = perSheet === 2 ? [841.89, 595.28] : [595.28, 841.89];
  const gap = 10;

  for (let start = 0; start < count; start += perSheet) {
    const page = output.addPage(sheet);
    const cellWidth = (sheet[0] - gap * (columns + 1)) / columns;
    const cellHeight = (sheet[1] - gap * (rows + 1)) / rows;

    const slice = Array.from(
      { length: Math.min(perSheet, count - start) },
      (_, offset) => start + offset,
    );
    const embedded = await output.embedPdf(source, slice);

    embedded.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const scale = Math.min(cellWidth / item.width, cellHeight / item.height);
      const width = item.width * scale;
      const height = item.height * scale;

      page.drawPage(item, {
        x: gap + column * (cellWidth + gap) + (cellWidth - width) / 2,
        y: sheet[1] - gap - (row + 1) * cellHeight - row * gap + (cellHeight - height) / 2,
        width,
        height,
      });
    });

    onProgress?.(Math.min(start + perSheet, count), count);
  }

  output.setProducer("orzix");
  return savePdf(output);
}

/** ---------------------------------------------------------------
 *  Metadata
 *  ------------------------------------------------------------- */

export type Metadata = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  created: string | null;
  modified: string | null;
};

export async function readMetadata(bytes: Uint8Array): Promise<Metadata> {
  const doc = await loadPdf(bytes);
  const date = (value: Date | undefined) =>
    value ? value.toISOString().slice(0, 10) : null;

  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: (doc.getKeywords() ?? "").toString(),
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    created: date(doc.getCreationDate()),
    modified: date(doc.getModificationDate()),
  };
}

/**
 * Clears everything, or writes replacements.
 *
 * Worth knowing what this does not do: it rewrites the document information
 * dictionary, which is what every reader displays. A file may also carry XMP
 * metadata, and pdf-lib does not expose it. For a document that has been
 * through several editors, some traces can remain.
 */
export async function writeMetadata(
  bytes: Uint8Array,
  metadata: Partial<Metadata>,
  clearDates: boolean,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);

  doc.setTitle(metadata.title ?? "");
  doc.setAuthor(metadata.author ?? "");
  doc.setSubject(metadata.subject ?? "");
  doc.setKeywords(metadata.keywords ? metadata.keywords.split(/,\s*/).filter(Boolean) : []);
  doc.setCreator(metadata.creator ?? "");
  doc.setProducer(metadata.producer ?? "");

  if (clearDates) {
    // There is no way to remove these outright, so they are set to the epoch —
    // which is plainly not a real authoring date.
    const epoch = new Date(0);
    doc.setCreationDate(epoch);
    doc.setModificationDate(epoch);
  }

  return savePdf(doc);
}

export { degrees };
