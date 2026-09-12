"use client";

import { PdfError } from "@/lib/pdf/document";

/**
 * Image compression and resizing, in the browser.
 *
 * Not a PDF job, but the same canvas work the PDF tools already do, and the
 * thing people most often actually need — a photo that is 8 MB and has to be
 * 2 MB, or a 4000-pixel image that needs to fit a page.
 */

export type OptimiseOptions = {
  /** Longest edge in pixels. 0 leaves the size alone. */
  maxEdge: number;
  /** JPEG and WEBP quality, 0 to 1. Ignored for PNG. */
  quality: number;
  format: "image/jpeg" | "image/png" | "image/webp" | "keep";
};

export type OptimisedImage = {
  name: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
};

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new PdfError(`${file.name} could not be read as an image.`);
  }
}

export async function optimiseImage(
  file: File,
  options: OptimiseOptions,
): Promise<OptimisedImage> {
  const bitmap = await decode(file);

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = options.maxEdge > 0 && longest > options.maxEdge ? options.maxEdge / longest : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PdfError("Your browser could not process this image.");

  // Better downscaling than the default, which produces visible aliasing on
  // detailed photographs.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const type =
    options.format === "keep"
      ? file.type === "image/png" || file.type === "image/webp"
        ? file.type
        : "image/jpeg"
      : options.format;

  // A JPEG has no transparency, so anything transparent becomes white rather
  // than black — which is what a naive conversion produces.
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, type === "image/png" ? undefined : options.quality),
  );
  if (!blob) throw new PdfError("The image could not be written.");

  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    name: `${base}.${EXTENSION[type] ?? "jpg"}`,
    blob,
    width,
    height,
    originalSize: file.size,
  };
}

export async function optimiseAll(
  files: File[],
  options: OptimiseOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<OptimisedImage[]> {
  const results: OptimisedImage[] = [];
  for (const [index, file] of files.entries()) {
    results.push(await optimiseImage(file, options));
    onProgress?.(index + 1, files.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return results;
}
