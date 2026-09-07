import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, readFileBytes, savePdf } from "@/lib/pdf/document";

export type MergeProgress = (completed: number, total: number, fileName: string) => void;

export async function mergePdfs(files: File[], onProgress?: MergeProgress): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new PdfError("Add at least two PDFs to merge.");
  }

  const merged = await PDFDocument.create();
  for (const [index, file] of files.entries()) {
    const source = await loadPdf(await readFileBytes(file));
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
    onProgress?.(index + 1, files.length, file.name);
  }

  merged.setProducer("PDFFlow");
  merged.setCreator("PDFFlow");
  return savePdf(merged);
}
