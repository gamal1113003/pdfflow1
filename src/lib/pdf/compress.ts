"use client";

import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";

export type CompressionLevel = "basic" | "strong" | "extreme";

export const COMPRESSION_LEVELS: {
  id: CompressionLevel;
  label: string;
  hint: string;
  keepsText: boolean;
}[] = [
  {
    id: "basic",
    label: "Basic",
    hint: "Good balance between size and quality. Text stays selectable.",
    keepsText: true,
  },
  {
    id: "strong",
    label: "Strong",
    hint: "Smaller file with some quality reduction. Pages become images.",
    keepsText: false,
  },
  {
    id: "extreme",
    label: "Extreme",
    hint: "Maximum compression, best for scans you only need to read.",
    keepsText: false,
  },
];

const RASTER_SETTINGS: Record<Exclude<CompressionLevel, "basic">, { scale: number; quality: number }> = {
  strong: { scale: 1.35, quality: 0.6 },
  extreme: { scale: 1.0, quality: 0.4 },
};

export type CompressResult = {
  bytes: Uint8Array;
  keptText: boolean;
};

/**
 * "Basic" rewrites the file with object streams and drops metadata, which is
 * lossless. "Strong" and "Extreme" re-render each page to a JPEG, which is a
 * real size reduction but makes text non-selectable — the UI says so.
 */
export async function compressPdf(
  bytes: Uint8Array,
  level: CompressionLevel,
  onProgress?: (fraction: number) => void,
): Promise<CompressResult> {
  if (level === "basic") {
    const doc = await loadPdf(bytes);
    doc.setTitle("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("PDFFlow");
    doc.setCreator("PDFFlow");
    onProgress?.(1);
    return { bytes: await savePdf(doc), keptText: true };
  }

  const { scale, quality } = RASTER_SETTINGS[level];
  const source = await openDocument(bytes);
  try {
    const output = await PDFDocument.create();
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
      const page = await source.getPage(pageNumber);
      const viewport = page.getViewport({ scale, rotation: page.rotate });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new PdfError("Your browser could not render this PDF.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const image = await output.embedJpg(dataUrl);
      const pdfPage = output.addPage([viewport.width / scale, viewport.height / scale]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: pdfPage.getWidth(),
        height: pdfPage.getHeight(),
      });

      page.cleanup();
      onProgress?.(pageNumber / source.numPages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    output.setProducer("PDFFlow");
    return { bytes: await savePdf(output), keptText: false };
  } finally {
    await source.destroy();
  }
}
