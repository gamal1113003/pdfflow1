"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, readFileBytes, savePdf } from "@/lib/pdf/document";
import { openDocument, renderPage } from "@/lib/pdf/render";
import { baseName } from "@/lib/utils";

export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";

const SIZES: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export type ImagesToPdfOptions = {
  pageSize: PageSize;
  orientation: Orientation;
  /** Page margin in points. */
  margin: number;
};

export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions,
  onProgress?: (completed: number, total: number) => void,
): Promise<Uint8Array> {
  if (files.length === 0) throw new PdfError("Add at least one image.");
  const doc = await PDFDocument.create();

  for (const [index, file] of files.entries()) {
    const bytes = await readFileBytes(file);
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    let pageWidth: number;
    let pageHeight: number;
    if (options.pageSize === "fit") {
      pageWidth = image.width + options.margin * 2;
      pageHeight = image.height + options.margin * 2;
    } else {
      const [w, h] = SIZES[options.pageSize];
      const landscape =
        options.orientation === "landscape" ||
        (options.orientation === "auto" && image.width > image.height);
      pageWidth = landscape ? h : w;
      pageHeight = landscape ? w : h;
    }

    const page = doc.addPage([pageWidth, pageHeight]);
    const maxWidth = pageWidth - options.margin * 2;
    const maxHeight = pageHeight - options.margin * 2;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    page.drawImage(image, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
    onProgress?.(index + 1, files.length);
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}

export type ExportedImage = {
  pageNumber: number;
  fileName: string;
  blob: Blob;
  dataUrl: string;
};

export type PdfToImagesOptions = {
  format: "image/jpeg" | "image/png";
  /** Roughly 1 = 72dpi, 2 = 144dpi, 3 = 216dpi. */
  scale: number;
  quality: number;
  pageNumbers?: number[];
};

export async function pdfToImages(
  bytes: Uint8Array,
  fileName: string,
  options: PdfToImagesOptions,
  onProgress?: (completed: number, total: number) => void,
): Promise<ExportedImage[]> {
  const doc = await openDocument(bytes);
  try {
    const pages =
      options.pageNumbers && options.pageNumbers.length > 0
        ? options.pageNumbers
        : Array.from({ length: doc.numPages }, (_, i) => i + 1);

    const extension = options.format === "image/png" ? "png" : "jpg";
    const results: ExportedImage[] = [];

    for (const [index, pageNumber] of pages.entries()) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
      const maxEdge = Math.max(viewport.width, viewport.height) * options.scale;
      const rendered = await renderPage(doc, pageNumber, {
        maxEdge,
        type: options.format,
        quality: options.quality,
      });
      const blob = await (await fetch(rendered.dataUrl)).blob();
      results.push({
        pageNumber,
        fileName: `${baseName(fileName)}-page-${pageNumber}.${extension}`,
        blob,
        dataUrl: rendered.dataUrl,
      });
      onProgress?.(index + 1, pages.length);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return results;
  } finally {
    await doc.destroy();
  }
}

export async function zipFiles(entries: { fileName: string; blob: Blob }[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.fileName, entry.blob);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
