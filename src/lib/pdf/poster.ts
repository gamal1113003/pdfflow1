"use client";

import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

/**
 * Splitting each page across several sheets, to print something larger than
 * the printer can manage.
 *
 * Each tile is the original page, positioned so that only the part belonging
 * to that tile falls inside the sheet, with the rest hanging outside the page
 * boundary where it is not printed. An overlap is added along the shared
 * edges so the pieces can be trimmed and joined without a white line.
 */

export type PosterOptions = {
  /** Sheets across and down. */
  columns: number;
  rows: number;
  /** Overlap in points, for trimming and taping. */
  overlap: number;
  /** Sheet size to print on. */
  sheet: "a4" | "a4-landscape" | "letter";
  marks: boolean;
};

const SHEETS: Record<PosterOptions["sheet"], [number, number]> = {
  a4: [595.28, 841.89],
  "a4-landscape": [841.89, 595.28],
  letter: [612, 792],
};

export async function makePoster(
  bytes: Uint8Array,
  options: PosterOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  if (options.columns < 1 || options.rows < 1) {
    throw new PdfError("A poster needs at least one sheet in each direction.");
  }

  const source = await loadPdf(bytes);
  const output = await PDFDocument.create();
  const [sheetWidth, sheetHeight] = SHEETS[options.sheet];
  const margin = 18;

  const pageCount = source.getPageCount();
  const tilesPerPage = options.columns * options.rows;
  let done = 0;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const embedded = await output.embedPdf(source, [pageIndex]);
    const original = embedded[0];

    // The printable area of one sheet, before overlap is taken into account.
    const usableWidth = sheetWidth - margin * 2;
    const usableHeight = sheetHeight - margin * 2;

    // How much the original is enlarged so that it fills the grid.
    const scale = Math.min(
      (usableWidth * options.columns - options.overlap * (options.columns - 1)) / original.width,
      (usableHeight * options.rows - options.overlap * (options.rows - 1)) / original.height,
    );

    const fullWidth = original.width * scale;
    const fullHeight = original.height * scale;

    for (let row = 0; row < options.rows; row++) {
      for (let column = 0; column < options.columns; column++) {
        const sheet = output.addPage([sheetWidth, sheetHeight]);

        // Shift the whole enlarged page so this tile's portion lands on the
        // sheet. Everything outside is clipped by the page edge.
        const offsetX = column * (usableWidth - options.overlap);
        // Rows count from the top, but PDF coordinates start at the bottom.
        const offsetY = (options.rows - 1 - row) * (usableHeight - options.overlap);

        sheet.drawPage(original, {
          x: margin - offsetX,
          y: margin - offsetY - (fullHeight - usableHeight * options.rows + options.overlap * (options.rows - 1)),
          width: fullWidth,
          height: fullHeight,
        });

        if (options.marks) {
          // Faint guides along the edges that will be joined.
          const grey = 0.75;
          if (column > 0) {
            sheet.drawLine({
              start: { x: margin + options.overlap, y: 0 },
              end: { x: margin + options.overlap, y: sheetHeight },
              thickness: 0.4,
              opacity: grey,
            });
          }
          if (row > 0) {
            sheet.drawLine({
              start: { x: 0, y: sheetHeight - margin - options.overlap },
              end: { x: sheetWidth, y: sheetHeight - margin - options.overlap },
              thickness: 0.4,
              opacity: grey,
            });
          }
        }

        done++;
        onProgress?.(done, pageCount * tilesPerPage);
      }
    }
  }

  output.setProducer("orzix");
  return savePdf(output);
}
