"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";

/**
 * Turning photographs of paper into something that looks scanned.
 *
 * Two problems have to be solved. A photograph is taken at an angle, so the
 * page is a trapezium rather than a rectangle; and the lighting is uneven, so
 * the paper is grey on one side and white on the other.
 *
 * The first is fixed with a perspective transform, the second with a local
 * threshold. Neither is done automatically from edge detection — that is
 * unreliable on a patterned desk or a page with a dark photograph on it, and a
 * wrong automatic crop is worse than dragging four corners yourself.
 */

export type Corner = { x: number; y: number };
/** Four corners, clockwise from the top left, as fractions of the image. */
export type Quad = [Corner, Corner, Corner, Corner];

export type Enhancement = "original" | "colour" | "grey" | "paper";

export const FULL_QUAD: Quad = [
  { x: 0.04, y: 0.04 },
  { x: 0.96, y: 0.04 },
  { x: 0.96, y: 0.96 },
  { x: 0.04, y: 0.96 },
];

/**
 * Solves for the homography mapping the destination rectangle back to the
 * source quadrilateral.
 *
 * Eight unknowns, eight equations — one pair per corner. Gaussian elimination
 * is more than adequate at this size, and avoids pulling in a matrix library
 * for one calculation.
 */
function homography(quad: Quad, width: number, height: number): number[] {
  const destination: Corner[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  const matrix: number[][] = [];
  const vector: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = quad[i];
    const { x: dx, y: dy } = destination[i];
    matrix.push([dx, dy, 1, 0, 0, 0, -dx * sx, -dy * sx]);
    vector.push(sx);
    matrix.push([0, 0, 0, dx, dy, 1, -dx * sy, -dy * sy]);
    vector.push(sy);
  }

  // Gaussian elimination with partial pivoting.
  for (let column = 0; column < 8; column++) {
    let pivot = column;
    for (let row = column + 1; row < 8; row++) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    [vector[column], vector[pivot]] = [vector[pivot], vector[column]];

    const lead = matrix[column][column];
    if (Math.abs(lead) < 1e-10) {
      throw new PdfError("Those corners do not form a usable shape. Spread them further apart.");
    }

    for (let row = column + 1; row < 8; row++) {
      const factor = matrix[row][column] / lead;
      for (let k = column; k < 8; k++) matrix[row][k] -= factor * matrix[column][k];
      vector[row] -= factor * vector[column];
    }
  }

  const solution = new Array(8).fill(0);
  for (let row = 7; row >= 0; row--) {
    let sum = vector[row];
    for (let k = row + 1; k < 8; k++) sum -= matrix[row][k] * solution[k];
    solution[row] = sum / matrix[row][row];
  }

  return [...solution, 1];
}

/** Bilinear sample, so the corrected page does not come out blocky. */
function sample(
  source: ImageData,
  x: number,
  y: number,
  into: Uint8ClampedArray,
  target: number,
) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  for (let channel = 0; channel < 3; channel++) {
    let total = 0;
    for (const [dx, dy, weight] of [
      [0, 0, (1 - fx) * (1 - fy)],
      [1, 0, fx * (1 - fy)],
      [0, 1, (1 - fx) * fy],
      [1, 1, fx * fy],
    ] as [number, number, number][]) {
      const sx = Math.min(Math.max(x0 + dx, 0), source.width - 1);
      const sy = Math.min(Math.max(y0 + dy, 0), source.height - 1);
      total += source.data[(sy * source.width + sx) * 4 + channel] * weight;
    }
    into[target + channel] = total;
  }
  into[target + 3] = 255;
}

/**
 * Adaptive threshold.
 *
 * A single cut-off across the whole image loses the shaded side of the page. A
 * pixel is compared instead to the average of the area around it, which
 * handles a gradient across the paper — the same approach a scanner uses.
 */
function toPaper(data: ImageData): void {
  const { width, height } = data;
  const grey = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    grey[i] =
      data.data[i * 4] * 0.299 + data.data[i * 4 + 1] * 0.587 + data.data[i * 4 + 2] * 0.114;
  }

  // Integral image, so each window average costs four lookups rather than
  // hundreds — the difference between instant and several seconds.
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += grey[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  const radius = Math.max(8, Math.floor(Math.min(width, height) / 40));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(x - radius, 0);
      const y0 = Math.max(y - radius, 0);
      const x1 = Math.min(x + radius, width - 1);
      const y1 = Math.min(y + radius, height - 1);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];

      // 88% of the local average: below that is ink, above is paper. Slightly
      // under 1 so that faint shading does not register as text.
      const value = grey[y * width + x] < (sum / area) * 0.88 ? 0 : 255;
      const target = (y * width + x) * 4;
      data.data[target] = value;
      data.data[target + 1] = value;
      data.data[target + 2] = value;
    }
  }
}

function toGrey(data: ImageData, boost: boolean): void {
  for (let i = 0; i < data.data.length; i += 4) {
    let value =
      data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114;
    if (boost) {
      // Stretch the mid-tones so a dull photograph looks like a scan.
      value = Math.min(255, Math.max(0, (value - 110) * 1.7 + 140));
    }
    data.data[i] = value;
    data.data[i + 1] = value;
    data.data[i + 2] = value;
  }
}

export type ScanPage = {
  id: string;
  /** The photograph, as a data URL. */
  source: string;
  quad: Quad;
  enhancement: Enhancement;
};

/** Corrects the perspective and applies the chosen treatment. */
export async function processScan(
  page: ScanPage,
  maxEdge = 2000,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new PdfError("That photograph could not be read."));
    image.src = page.source;
  });

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new PdfError("Your browser could not read the photograph.");
  sourceContext.drawImage(image, 0, 0);
  const source = sourceContext.getImageData(0, 0, image.width, image.height);

  // Output size follows the average of the two pairs of opposite edges, which
  // approximates the real proportions of the page better than either alone.
  const pixels: Quad = page.quad.map((corner) => ({
    x: corner.x * image.width,
    y: corner.y * image.height,
  })) as Quad;

  const distance = (a: Corner, b: Corner) => Math.hypot(a.x - b.x, a.y - b.y);
  const widthGuess = (distance(pixels[0], pixels[1]) + distance(pixels[3], pixels[2])) / 2;
  const heightGuess = (distance(pixels[0], pixels[3]) + distance(pixels[1], pixels[2])) / 2;

  const scale = Math.min(1, maxEdge / Math.max(widthGuess, heightGuess));
  const width = Math.max(1, Math.round(widthGuess * scale));
  const height = Math.max(1, Math.round(heightGuess * scale));

  const matrix = homography(pixels, width, height);
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new PdfError("Your browser could not draw the page.");
  const result = context.createImageData(width, height);

  const [a, b, c, d, e, f, g, h] = matrix;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const denominator = g * x + h * y + 1;
      sample(
        source,
        (a * x + b * y + c) / denominator,
        (d * x + e * y + f) / denominator,
        result.data,
        (y * width + x) * 4,
      );
    }
  }

  if (page.enhancement === "paper") toPaper(result);
  else if (page.enhancement === "grey") toGrey(result, true);
  else if (page.enhancement === "colour") {
    for (let i = 0; i < result.data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        result.data[i + channel] = Math.min(
          255,
          Math.max(0, (result.data[i + channel] - 105) * 1.45 + 130),
        );
      }
    }
  }

  context.putImageData(result, 0, 0);

  return {
    // A bilevel page compresses far better as PNG; a photograph as JPEG.
    dataUrl:
      page.enhancement === "paper"
        ? output.toDataURL("image/png")
        : output.toDataURL("image/jpeg", 0.9),
    width,
    height,
  };
}

export async function buildScanPdf(
  pages: ScanPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  if (pages.length === 0) throw new PdfError("Add at least one photograph.");

  const doc = await PDFDocument.create();
  const a4 = { width: 595.28, height: 841.89 };

  for (const [index, page] of pages.entries()) {
    const processed = await processScan(page);
    const image = processed.dataUrl.startsWith("data:image/png")
      ? await doc.embedPng(processed.dataUrl)
      : await doc.embedJpg(processed.dataUrl);

    // Portrait or landscape, whichever fits the page better.
    const landscape = processed.width > processed.height;
    const sheet = landscape ? [a4.height, a4.width] : [a4.width, a4.height];
    const target = doc.addPage(sheet as [number, number]);

    const margin = 16;
    const scale = Math.min(
      (target.getWidth() - margin * 2) / processed.width,
      (target.getHeight() - margin * 2) / processed.height,
    );
    const drawWidth = processed.width * scale;
    const drawHeight = processed.height * scale;

    target.drawImage(image, {
      x: (target.getWidth() - drawWidth) / 2,
      y: (target.getHeight() - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });

    onProgress?.(index + 1, pages.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}
