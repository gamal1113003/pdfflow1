"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, readFileBytes, savePdf } from "@/lib/pdf/document";
import { runServiceJob, ServiceUnavailableError, type ServiceJob } from "@/lib/services/pdfService";

/**
 * Accepts more than PDFs.
 *
 * Every tool works on a PDF, so anything else is converted to one first and
 * the tool then runs unchanged. Where that conversion happens depends on the
 * format:
 *
 *   JPG, PNG        — in the browser, with pdf-lib
 *   DOC(X), XLS(X), PPT(X) — on the server, because reproducing Office layout
 *                     needs a real layout engine
 *
 * If no backend is connected the Office formats fail with a clear message
 * rather than producing something broken.
 */

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
// Both the modern and legacy extensions of each Office format: nearly every
// Word file today is .docx, so accepting only .doc would reject most of them.
export const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

/** Everything a PDF tool will now take. */
export const ACCEPTED_INPUT = ["pdf", ...OFFICE_EXTENSIONS, ...IMAGE_EXTENSIONS];

/**
 * Tools that need words on the page, not pixels. Translation reads the text
 * layer, and a photo has none — so images are not offered there.
 */
export const DOCUMENT_INPUT = ["pdf", ...OFFICE_EXTENSIONS];

const OFFICE_JOB: Record<string, ServiceJob> = {
  doc: "word-to-pdf",
  docx: "word-to-pdf",
  xls: "excel-to-pdf",
  xlsx: "excel-to-pdf",
  ppt: "ppt-to-pdf",
  pptx: "ppt-to-pdf",
};

export function extensionOf(file: File): string {
  return (file.name.split(".").pop() ?? "").toLowerCase();
}

export function needsConversion(file: File): boolean {
  return extensionOf(file) !== "pdf";
}

/** Describes what will happen, so the UI can say so before it starts. */
export function conversionLabel(file: File): string | null {
  const ext = extensionOf(file);
  if (ext === "pdf") return null;
  if (IMAGE_EXTENSIONS.includes(ext)) return "Converting your image to PDF";
  if (OFFICE_EXTENSIONS.includes(ext)) return "Converting your document to PDF";
  return null;
}

/**
 * Longest page edge in points. A4 is 842pt tall, so this keeps pages a normal
 * document size.
 *
 * Using one point per pixel instead would make a 3000px photo into a page
 * 3000pt — roughly 42 inches — across. That is a legal PDF but an unreasonable
 * one: it prints wrong, and OCR rejects the output as invalid.
 *
 * Page size is only the display box. The image itself is embedded at its
 * original resolution either way, so nothing is thrown away here.
 */
const MAX_PAGE_EDGE = 842;

async function imageToPdf(file: File): Promise<Uint8Array> {
  const bytes = await readFileBytes(file);
  const doc = await PDFDocument.create();
  const ext = extensionOf(file);

  const image = ext === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

  const longest = Math.max(image.width, image.height);
  const scale = longest > MAX_PAGE_EDGE ? MAX_PAGE_EDGE / longest : 1;
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const page = doc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  doc.setProducer("orzix");
  return savePdf(doc);
}

async function officeToPdf(file: File): Promise<Uint8Array> {
  const job = OFFICE_JOB[extensionOf(file)];
  if (!job) throw new PdfError("That file type is not supported.");

  try {
    const result = await runServiceJob(job, file);
    return new Uint8Array(await result.blob.arrayBuffer());
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new PdfError(
        "Word, Excel and PowerPoint files need a connection, and nothing is connected to this build. Save the file as PDF and upload that instead.",
      );
    }
    throw error;
  }
}

export type IngestResult = {
  bytes: Uint8Array;
  /** The name the tool should use, always ending in .pdf. */
  fileName: string;
  /** True when the upload was converted rather than used directly. */
  converted: boolean;
};

/** Turns any accepted upload into PDF bytes. */
export async function ingestAsPdf(file: File): Promise<IngestResult> {
  const ext = extensionOf(file);
  const base = file.name.replace(/\.[^.]+$/, "");

  if (ext === "pdf") {
    return { bytes: await readFileBytes(file), fileName: file.name, converted: false };
  }

  let bytes: Uint8Array;
  if (IMAGE_EXTENSIONS.includes(ext)) {
    bytes = await imageToPdf(file);
  } else if (OFFICE_EXTENSIONS.includes(ext)) {
    bytes = await officeToPdf(file);
  } else {
    throw new PdfError(`Files of type .${ext} are not supported.`);
  }

  return { bytes, fileName: `${base}.pdf`, converted: true };
}
