"use client";

import { PDFDocument, degrees } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";

/**
 * Annotations are stored in **display space**: every coordinate is a fraction
 * (0–1) of the page as the person sees it, measured from the top-left. That
 * keeps the editor honest on rotated pages — what you draw is what you get.
 */
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export type Annotation =
  | { id: string; page: number; kind: "text"; at: Point; text: string; size: number; color: string }
  | { id: string; page: number; kind: "draw"; points: Point[]; color: string; width: number }
  | { id: string; page: number; kind: "highlight"; rect: Rect; color: string }
  | { id: string; page: number; kind: "rect"; rect: Rect; color: string; width: number }
  | { id: string; page: number; kind: "blackout"; rect: Rect }
  | { id: string; page: number; kind: "image"; rect: Rect; dataUrl: string };

export const TEXT_FONT_STACK =
  '"Segoe UI", "Helvetica Neue", Arial, "Noto Sans", system-ui, sans-serif';

/**
 * Draws one page's annotations onto a canvas context sized to the displayed
 * page. The same routine backs both the export and the flattened output, so
 * what is exported always matches what was drawn.
 */
export async function paintAnnotations(
  context: CanvasRenderingContext2D,
  annotations: Annotation[],
  width: number,
  height: number,
): Promise<void> {
  for (const item of annotations) {
    context.save();

    switch (item.kind) {
      case "highlight": {
        context.globalCompositeOperation = "multiply";
        context.fillStyle = item.color;
        context.globalAlpha = 0.42;
        context.fillRect(
          item.rect.x * width,
          item.rect.y * height,
          item.rect.width * width,
          item.rect.height * height,
        );
        break;
      }

      case "blackout": {
        context.fillStyle = "#000000";
        context.fillRect(
          item.rect.x * width,
          item.rect.y * height,
          item.rect.width * width,
          item.rect.height * height,
        );
        break;
      }

      case "rect": {
        context.strokeStyle = item.color;
        context.lineWidth = Math.max(item.width * height, 1);
        context.strokeRect(
          item.rect.x * width,
          item.rect.y * height,
          item.rect.width * width,
          item.rect.height * height,
        );
        break;
      }

      case "draw": {
        if (item.points.length < 2) break;
        context.strokeStyle = item.color;
        context.lineWidth = Math.max(item.width * height, 1);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(item.points[0].x * width, item.points[0].y * height);
        for (const point of item.points.slice(1)) {
          context.lineTo(point.x * width, point.y * height);
        }
        context.stroke();
        break;
      }

      case "text": {
        // Rendering text through the browser's own engine means every script
        // works — Cyrillic, Greek, Arabic, CJK — without embedding a font.
        const fontSize = item.size * height;
        context.fillStyle = item.color;
        context.font = `${fontSize}px ${TEXT_FONT_STACK}`;
        context.textBaseline = "top";
        const lines = item.text.split("\n");
        lines.forEach((line, index) => {
          context.fillText(line, item.at.x * width, item.at.y * height + index * fontSize * 1.25);
        });
        break;
      }

      case "image": {
        const image = await loadImage(item.dataUrl);
        context.drawImage(
          image,
          item.rect.x * width,
          item.rect.y * height,
          item.rect.width * width,
          item.rect.height * height,
        );
        break;
      }
    }

    context.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new PdfError("An added image could not be read."));
    image.src = src;
  });
}

/**
 * Places a full-page overlay so it lines up with the page as displayed,
 * compensating for the page's /Rotate value. pdf-lib rotates counter-clockwise
 * around the image's bottom-left corner, hence the anchor per quarter turn.
 */
function overlayPlacement(
  rotation: number,
  box: { x: number; y: number; width: number; height: number },
) {
  const { x, y, width, height } = box;
  switch (rotation) {
    case 90:
      return { x: x + width, y, width: height, height: width, rotate: degrees(90) };
    case 180:
      return { x: x + width, y: y + height, width, height, rotate: degrees(180) };
    case 270:
      return { x, y: y + height, width: height, height: width, rotate: degrees(270) };
    default:
      return { x, y, width, height, rotate: degrees(0) };
  }
}

export type ApplyOptions = {
  /**
   * Re-renders every page as an image. Slower and larger, but it is the only
   * way a black-out actually removes the text underneath rather than covering
   * it — see the note in the editor.
   */
  flatten: boolean;
  onProgress?: (fraction: number) => void;
};

export async function applyAnnotations(
  bytes: Uint8Array,
  annotations: Annotation[],
  options: ApplyOptions,
): Promise<Uint8Array> {
  return options.flatten
    ? flattenWithAnnotations(bytes, annotations, options.onProgress)
    : stampAnnotations(bytes, annotations, options.onProgress);
}

/** Keeps the original page content and adds a transparent overlay on top. */
async function stampAnnotations(
  bytes: Uint8Array,
  annotations: Annotation[],
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const byPage = groupByPage(annotations);
  const pageNumbers = [...byPage.keys()];

  for (const [index, pageNumber] of pageNumbers.entries()) {
    const page = pages[pageNumber - 1];
    if (!page) continue;

    const box = page.getCropBox();
    const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
    const quarterTurn = rotation === 90 || rotation === 270;
    const displayWidth = quarterTurn ? box.height : box.width;
    const displayHeight = quarterTurn ? box.width : box.height;

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(displayWidth * scale));
    canvas.height = Math.max(1, Math.round(displayHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new PdfError("Your browser could not draw the annotations.");

    await paintAnnotations(context, byPage.get(pageNumber) ?? [], canvas.width, canvas.height);

    const png = await doc.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(png, overlayPlacement(rotation, box));

    onProgress?.((index + 1) / pageNumbers.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}

/** Rebuilds every page as a flat image with the annotations baked in. */
async function flattenWithAnnotations(
  bytes: Uint8Array,
  annotations: Annotation[],
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  const source = await openDocument(bytes);
  const byPage = groupByPage(annotations);

  try {
    const output = await PDFDocument.create();
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
      const page = await source.getPage(pageNumber);
      const scale = 2;
      const viewport = page.getViewport({ scale, rotation: page.rotate });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new PdfError("Your browser could not render this PDF.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;
      await paintAnnotations(context, byPage.get(pageNumber) ?? [], canvas.width, canvas.height);

      const jpeg = await output.embedJpg(canvas.toDataURL("image/jpeg", 0.88));
      const pdfPage = output.addPage([viewport.width / scale, viewport.height / scale]);
      pdfPage.drawImage(jpeg, {
        x: 0,
        y: 0,
        width: pdfPage.getWidth(),
        height: pdfPage.getHeight(),
      });

      page.cleanup();
      onProgress?.(pageNumber / source.numPages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    output.setProducer("orzix");
    return savePdf(output);
  } finally {
    await source.destroy();
  }
}

function groupByPage(annotations: Annotation[]): Map<number, Annotation[]> {
  const map = new Map<number, Annotation[]>();
  for (const item of annotations) {
    const list = map.get(item.page) ?? [];
    list.push(item);
    map.set(item.page, list);
  }
  return map;
}
