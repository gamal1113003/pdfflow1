"use client";

import { pdfToImages } from "@/lib/pdf/images";
import { PdfError } from "@/lib/pdf/document";

/**
 * Renders a single-page PDF back to the image format it came from.
 *
 * Tools work internally on PDFs, so a JPG upload is converted on the way in.
 * Without this the person would upload a photo and receive a PDF, which is not
 * what they asked for.
 */
export async function pdfBackToImage(
  bytes: Uint8Array,
  fileName: string,
  format: "jpg" | "png",
): Promise<{ blob: Blob; fileName: string }> {
  const images = await pdfToImages(bytes, fileName, {
    format: format === "png" ? "image/png" : "image/jpeg",
    // Pages are laid out at document size, so a higher factor is needed to
    // come back at a useful pixel size: 842pt at 5x is about 4200px.
    scale: 5,
    quality: 0.95,
    pageNumbers: [1],
  });

  if (images.length === 0) throw new PdfError("The image could not be produced.");

  const base = fileName.replace(/\.[^.]+$/, "");
  return { blob: images[0].blob, fileName: `${base}.${format}` };
}

/** Maps the uploaded extension to an output format, or null for real PDFs. */
export function imageFormatOf(convertedFrom?: string): "jpg" | "png" | null {
  if (!convertedFrom) return null;
  const ext = convertedFrom.toLowerCase();
  if (ext === "png") return "png";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  return null;
}
