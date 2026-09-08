import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

export type MergeProgress = (completed: number, total: number, fileName: string) => void;

export type MergeSource = { name: string; bytes: Uint8Array };

/**
 * Combines documents that have already been converted to PDF. Conversion
 * happens in the widget, so a Word file or a photo can be merged alongside
 * a PDF.
 */
export async function mergePdfs(
  sources: MergeSource[],
  onProgress?: MergeProgress,
): Promise<Uint8Array> {
  if (sources.length < 2) {
    throw new PdfError("Add at least two files to merge.");
  }

  const merged = await PDFDocument.create();
  for (const [index, source] of sources.entries()) {
    const doc = await loadPdf(source.bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
    onProgress?.(index + 1, sources.length, source.name);
  }

  merged.setProducer("orzix");
  merged.setCreator("orzix");
  return savePdf(merged);
}
