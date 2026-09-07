import { PDFDocument } from "pdf-lib";

export type PdfInfo = {
  pageCount: number;
  title?: string;
  encrypted: boolean;
};

export class PdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfError";
  }
}

export async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

/**
 * pdf.js and pdf-lib both detach the ArrayBuffer they are handed, so every
 * consumer works from its own copy of the bytes.
 */
export function copyBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(copyBytes(bytes), { ignoreEncryption: true });
  } catch (error) {
    if (error instanceof Error && /password|encrypt/i.test(error.message)) {
      throw new PdfError("This PDF is password protected. Unlock it first, then try again.");
    }
    throw new PdfError("This file could not be read as a PDF. It may be damaged.");
  }
}

export async function getPdfInfo(bytes: Uint8Array): Promise<PdfInfo> {
  const doc = await loadPdf(bytes);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || undefined,
    encrypted: doc.isEncrypted,
  };
}

export async function savePdf(doc: PDFDocument): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true, addDefaultPage: false });
}

export function toBlob(bytes: Uint8Array, type = "application/pdf"): Blob {
  return new Blob([bytes as unknown as BlobPart], { type });
}
