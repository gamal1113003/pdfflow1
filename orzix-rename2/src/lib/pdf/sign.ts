import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

export type SignaturePlacement = {
  /** 1-based page number. */
  pageNumber: number;
  /** Position and size as a fraction of the page, measured from the top-left. */
  x: number;
  y: number;
  width: number;
};

export async function signPdf(
  bytes: Uint8Array,
  signaturePngDataUrl: string,
  placement: SignaturePlacement,
): Promise<Uint8Array> {
  if (!signaturePngDataUrl) throw new PdfError("Add a signature before applying it.");

  const doc = await loadPdf(bytes);
  const pages = doc.getPages();
  const page = pages[placement.pageNumber - 1];
  if (!page) throw new PdfError("That page is no longer part of this document.");

  const png = await doc.embedPng(signaturePngDataUrl);
  const { width: pageWidth, height: pageHeight } = page.getSize();

  const drawWidth = pageWidth * placement.width;
  const drawHeight = drawWidth * (png.height / png.width);

  page.drawImage(png, {
    x: pageWidth * placement.x,
    // pdf-lib measures from the bottom-left; the UI measures from the top-left.
    y: pageHeight - pageHeight * placement.y - drawHeight,
    width: drawWidth,
    height: drawHeight,
  });

  doc.setProducer("orzix");
  return savePdf(doc);
}
