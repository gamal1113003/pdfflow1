import { PDFDocument, degrees } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

/**
 * A crop selection, stored as fractions (0–1) of the page **as displayed**,
 * measured from the top-left corner. Keeping it display-relative means the
 * rectangle the person drags is exactly the rectangle they get, whatever the
 * page's own /Rotate value happens to be.
 */
export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const FULL_PAGE: CropRect = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Maps a point in display space (origin top-left, Y downwards) back to
 * unrotated PDF user space (origin bottom-left, Y upwards).
 *
 * W and H are the *unrotated* page dimensions. For a page with /Rotate 90 or
 * 270 the displayed page is H wide and W tall, which is why the axes swap.
 */
function toPageSpace(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): { u: number; v: number } {
  switch (rotation) {
    case 90:
      return { u: y, v: x };
    case 180:
      return { u: width - x, v: y };
    case 270:
      return { u: width - y, v: height - x };
    default:
      return { u: x, v: height - y };
  }
}

/** Standard page sizes in PDF points (72 per inch). */
export const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

export type OutputPageSize = "keep" | "a4" | "letter";

export type CropOptions = {
  /** 1-based page numbers to crop. Omit to crop every page. */
  pageNumbers?: number[];
  /**
   * "keep" leaves each page exactly the size of the crop box. The standard
   * sizes place the cropped content, scaled to fit, on a printable page.
   */
  pageSize?: OutputPageSize;
  /** Margin around the content on a standard page, in points. */
  margin?: number;
};

/**
 * Crops pages by narrowing their CropBox and MediaBox.
 *
 * Nothing is deleted — the content outside the box is still in the file, it is
 * simply no longer part of the visible page, which is how every PDF editor
 * implements cropping. The page keeps its rotation.
 */
export async function cropPdf(
  bytes: Uint8Array,
  rect: CropRect,
  options: CropOptions = {},
): Promise<Uint8Array> {
  if (rect.width <= 0.01 || rect.height <= 0.01) {
    throw new PdfError("That crop area is too small. Drag a larger rectangle and try again.");
  }

  const doc = await loadPdf(bytes);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    if (options.pageNumbers && !options.pageNumbers.includes(index + 1)) return;

    // The current visible area is the reference frame, so cropping twice works.
    const box = page.getCropBox();
    const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
    const quarterTurn = rotation === 90 || rotation === 270;

    const displayWidth = quarterTurn ? box.height : box.width;
    const displayHeight = quarterTurn ? box.width : box.height;

    const left = rect.x * displayWidth;
    const top = rect.y * displayHeight;
    const right = (rect.x + rect.width) * displayWidth;
    const bottom = (rect.y + rect.height) * displayHeight;

    const cornerA = toPageSpace(left, top, box.width, box.height, rotation);
    const cornerB = toPageSpace(right, bottom, box.width, box.height, rotation);

    const x = Math.min(cornerA.u, cornerB.u) + box.x;
    const y = Math.min(cornerA.v, cornerB.v) + box.y;
    const width = Math.abs(cornerB.u - cornerA.u);
    const height = Math.abs(cornerB.v - cornerA.v);

    if (width < 1 || height < 1) return;

    page.setCropBox(x, y, width, height);
    // Some readers ignore CropBox, so narrow the MediaBox to match.
    page.setMediaBox(x, y, width, height);
  });

  doc.setProducer("orzix");

  const pageSize = options.pageSize ?? "keep";
  if (pageSize === "keep") return savePdf(doc);

  return fitToPageSize(await savePdf(doc), pageSize, options.margin ?? 28);
}

/**
 * Places every page, scaled to fit, on a standard sheet. Cropping alone leaves
 * pages the shape of the box that was drawn, which is fine on screen but awkward
 * to print — this makes the result A4 or Letter again.
 *
 * pdf-lib's embedPage drops the source page's /Rotate value, so the embedded
 * content is rotated back by hand to keep it the right way up.
 */
async function fitToPageSize(
  bytes: Uint8Array,
  size: Exclude<OutputPageSize, "keep">,
  margin: number,
): Promise<Uint8Array> {
  const source = await loadPdf(bytes);
  const output = await PDFDocument.create();
  const [sheetWidth, sheetHeight] = PAGE_SIZES[size];

  const pages = source.getPages();
  for (const page of pages) {
    const box = page.getCropBox();
    const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
    const quarterTurn = rotation === 90 || rotation === 270;

    const embedded = await output.embedPage(page, {
      left: box.x,
      bottom: box.y,
      right: box.x + box.width,
      top: box.y + box.height,
    });

    // Portrait or landscape sheet, whichever wastes less paper.
    const displayWidth = quarterTurn ? box.height : box.width;
    const displayHeight = quarterTurn ? box.width : box.height;
    const landscape = displayWidth > displayHeight;
    const targetWidth = landscape ? sheetHeight : sheetWidth;
    const targetHeight = landscape ? sheetWidth : sheetHeight;

    const sheet = output.addPage([targetWidth, targetHeight]);
    const availableWidth = targetWidth - margin * 2;
    const availableHeight = targetHeight - margin * 2;
    const scale = Math.min(availableWidth / displayWidth, availableHeight / displayHeight);

    const drawnWidth = displayWidth * scale;
    const drawnHeight = displayHeight * scale;
    const left = (targetWidth - drawnWidth) / 2;
    const bottom = (targetHeight - drawnHeight) / 2;

    // Anchor depends on the quarter turn, since pdf-lib rotates counter-clockwise
    // about the bottom-left corner of what it draws.
    const anchor =
      rotation === 90
        ? { x: left, y: bottom + drawnHeight }
        : rotation === 180
          ? { x: left + drawnWidth, y: bottom + drawnHeight }
          : rotation === 270
            ? { x: left + drawnWidth, y: bottom }
            : { x: left, y: bottom };

    sheet.drawPage(embedded, {
      x: anchor.x,
      y: anchor.y,
      width: box.width * scale,
      height: box.height * scale,
      rotate: degrees((360 - rotation) % 360),
    });
  }

  output.setProducer("orzix");
  return savePdf(output);
}
