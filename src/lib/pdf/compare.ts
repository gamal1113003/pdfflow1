"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument, renderPage } from "@/lib/pdf/render";

/**
 * Two ways of comparing documents, because people mean different things by it.
 *
 * Visual comparison renders both pages and marks where the pixels differ. It
 * catches everything — moved images, changed spacing, a different logo — but
 * it also flags differences nobody cares about, like a page rendered a hair
 * off from the other.
 *
 * Text comparison extracts the words and finds what was added and removed.
 * It ignores layout entirely, which is usually what you want when checking
 * whether the wording of a contract changed.
 */

export type PageDiff = {
  pageNumber: number;
  /** Composite image with differences marked. */
  dataUrl: string;
  /** Share of the page that differs, 0 to 1. */
  changed: number;
  /** Present when one document has more pages than the other. */
  onlyIn?: "left" | "right";
};

const DIFF_THRESHOLD = 32; // per-channel difference before a pixel counts

async function renderToCanvas(
  bytes: Uint8Array,
  pageNumber: number,
  width: number,
  height: number,
): Promise<HTMLCanvasElement | null> {
  const doc = await openDocument(bytes);
  try {
    if (pageNumber > doc.numPages) return null;
    const rendered = await renderPage(doc, pageNumber, {
      maxEdge: Math.max(width, height),
      type: "image/png",
    });

    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = rendered.dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new PdfError("Your browser could not draw the page.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    // Both pages are drawn at the same size so they can be compared pixel for
    // pixel, even if the originals differ slightly in dimensions.
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    await doc.destroy();
  }
}

/** Marks in red where the two pages differ, leaving the rest faded. */
function composeDiff(
  left: HTMLCanvasElement | null,
  right: HTMLCanvasElement | null,
  width: number,
  height: number,
): { dataUrl: string; changed: number } {
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new PdfError("Your browser could not draw the comparison.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const base = right ?? left;
  if (!base) return { dataUrl: output.toDataURL("image/png"), changed: 0 };

  // The surviving page is shown faded, so the red marks stand out against it.
  context.globalAlpha = 0.35;
  context.drawImage(base, 0, 0);
  context.globalAlpha = 1;

  if (!left || !right) {
    return { dataUrl: output.toDataURL("image/png"), changed: 1 };
  }

  const a = left.getContext("2d")!.getImageData(0, 0, width, height).data;
  const b = right.getContext("2d")!.getImageData(0, 0, width, height).data;
  const marks = context.createImageData(width, height);

  let changedPixels = 0;
  for (let i = 0; i < a.length; i += 4) {
    const delta =
      Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (delta > DIFF_THRESHOLD) {
      changedPixels++;
      marks.data[i] = 220;
      marks.data[i + 1] = 38;
      marks.data[i + 2] = 38;
      marks.data[i + 3] = 235;
    }
  }

  const overlay = document.createElement("canvas");
  overlay.width = width;
  overlay.height = height;
  overlay.getContext("2d")!.putImageData(marks, 0, 0);
  context.drawImage(overlay, 0, 0);

  return {
    dataUrl: output.toDataURL("image/png"),
    changed: changedPixels / (width * height),
  };
}

export async function compareVisually(
  leftBytes: Uint8Array,
  rightBytes: Uint8Array,
  onProgress?: (done: number, total: number) => void,
): Promise<PageDiff[]> {
  const leftDoc = await openDocument(leftBytes);
  const rightDoc = await openDocument(rightBytes);
  const leftPages = leftDoc.numPages;
  const rightPages = rightDoc.numPages;
  await leftDoc.destroy();
  await rightDoc.destroy();

  const total = Math.max(leftPages, rightPages);
  const width = 900;
  const height = 1160;
  const diffs: PageDiff[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
    const left = await renderToCanvas(leftBytes, pageNumber, width, height);
    const right = await renderToCanvas(rightBytes, pageNumber, width, height);
    const { dataUrl, changed } = composeDiff(left, right, width, height);

    diffs.push({
      pageNumber,
      dataUrl,
      changed,
      onlyIn: !right ? "left" : !left ? "right" : undefined,
    });

    onProgress?.(pageNumber, total);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return diffs;
}

/** Builds a PDF of the marked-up pages, so the comparison can be shared. */
export async function diffToPdf(diffs: PageDiff[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const diff of diffs) {
    const image = await doc.embedPng(diff.dataUrl);
    const page = doc.addPage([595.28, 841.89]);
    const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
    page.drawImage(image, {
      x: (page.getWidth() - image.width * scale) / 2,
      y: (page.getHeight() - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });
  }
  doc.setProducer("orzix");
  return savePdf(doc);
}

// ---------------------------------------------------------------------------
// Text comparison
// ---------------------------------------------------------------------------

export type TextChange = { kind: "same" | "added" | "removed"; text: string };

async function extractWords(bytes: Uint8Array): Promise<string[]> {
  const doc = await openDocument(bytes);
  try {
    const words: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      words.push(...text.split(/\s+/).filter(Boolean));
      page.cleanup();
    }
    return words;
  } finally {
    await doc.destroy();
  }
}

/**
 * Word-level difference, by longest common subsequence.
 *
 * The table is O(n×m), so very long documents are cut off rather than left to
 * exhaust memory — a comparison that crashes the tab is worse than one that
 * says it only covered the first part.
 */
const MAX_WORDS = 6000;

export async function compareText(
  leftBytes: Uint8Array,
  rightBytes: Uint8Array,
): Promise<{ changes: TextChange[]; truncated: boolean }> {
  const leftAll = await extractWords(leftBytes);
  const rightAll = await extractWords(rightBytes);

  if (leftAll.length === 0 && rightAll.length === 0) {
    throw new PdfError(
      "Neither document has readable text. Scanned pages need OCR before they can be compared by wording — the visual comparison works on them as they are.",
    );
  }

  const truncated = leftAll.length > MAX_WORDS || rightAll.length > MAX_WORDS;
  const left = leftAll.slice(0, MAX_WORDS);
  const right = rightAll.slice(0, MAX_WORDS);

  const rows = left.length + 1;
  const cols = right.length + 1;
  const table = new Uint32Array(rows * cols);

  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        left[i] === right[j]
          ? table[(i + 1) * cols + (j + 1)] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + (j + 1)]);
    }
  }

  const changes: TextChange[] = [];
  const push = (kind: TextChange["kind"], text: string) => {
    const last = changes[changes.length - 1];
    if (last && last.kind === kind) last.text += ` ${text}`;
    else changes.push({ kind, text });
  };

  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      push("same", left[i]);
      i++;
      j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + (j + 1)]) {
      push("removed", left[i]);
      i++;
    } else {
      push("added", right[j]);
      j++;
    }
  }
  while (i < left.length) push("removed", left[i++]);
  while (j < right.length) push("added", right[j++]);

  return { changes, truncated };
}
