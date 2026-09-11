"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";

/**
 * Redaction that actually removes the content.
 *
 * Drawing a black rectangle over text does not delete the text. It sits in the
 * file underneath, and anyone can select it, copy it, or extract it with a
 * command-line tool. Documents have been leaked exactly this way — by
 * governments and law firms, repeatedly.
 *
 * So this tool does not offer the covering approach as an option. Each page is
 * rendered to an image, the black areas are painted onto that image, and the
 * original page is replaced. What is underneath is gone because the page it
 * lived on no longer exists.
 *
 * The costs are honest and unavoidable: the result is images rather than text,
 * so it cannot be searched or copied, and the file is larger. That is what
 * genuine redaction costs.
 */

export type RedactBox = {
  id: string;
  /** 1-based page number. */
  page: number;
  /** Position and size as fractions of the page, from the top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RedactOptions = {
  /** Rendering detail. Higher keeps the page readable; 2 is roughly 144 dpi. */
  scale?: number;
  onProgress?: (done: number, total: number) => void;
};

export async function redactPdf(
  bytes: Uint8Array,
  boxes: RedactBox[],
  options: RedactOptions = {},
): Promise<Uint8Array> {
  if (boxes.length === 0) {
    throw new PdfError("Draw at least one box over the part you want removed.");
  }

  const { scale = 2, onProgress } = options;
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
      if (!context) throw new PdfError("Your browser could not render this page.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      // Painted onto the image, before the image becomes the page. There is no
      // step at which the hidden content and the black box coexist.
      context.fillStyle = "#000000";
      for (const box of boxes.filter((entry) => entry.page === pageNumber)) {
        context.fillRect(
          box.x * canvas.width,
          box.y * canvas.height,
          box.width * canvas.width,
          box.height * canvas.height,
        );
      }

      const image = await output.embedJpg(canvas.toDataURL("image/jpeg", 0.9));
      const newPage = output.addPage([viewport.width / scale, viewport.height / scale]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: newPage.getWidth(),
        height: newPage.getHeight(),
      });

      page.cleanup();
      onProgress?.(pageNumber, source.numPages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Metadata can carry the author, the original file name, and editing
    // history. A redacted document should not keep any of it.
    output.setTitle("");
    output.setAuthor("");
    output.setSubject("");
    output.setKeywords([]);
    output.setProducer("orzix");
    output.setCreator("orzix");

    return savePdf(output);
  } finally {
    await source.destroy();
  }
}
