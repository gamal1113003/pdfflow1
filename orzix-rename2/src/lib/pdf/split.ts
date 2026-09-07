import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { baseName } from "@/lib/utils";

export type SplitResult = { fileName: string; bytes: Uint8Array; pages: number[] };

async function buildFrom(source: PDFDocument, pageNumbers: number[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  const pages = await output.copyPages(
    source,
    pageNumbers.map((n) => n - 1),
  );
  pages.forEach((page) => output.addPage(page));
  output.setProducer("orzix");
  return savePdf(output);
}

/** Every selected page ends up in a single new document. */
export async function extractPages(
  bytes: Uint8Array,
  fileName: string,
  pageNumbers: number[],
): Promise<SplitResult[]> {
  if (pageNumbers.length === 0) throw new PdfError("Select at least one page.");
  const source = await loadPdf(bytes);
  return [
    {
      fileName: `${baseName(fileName)}-pages.pdf`,
      bytes: await buildFrom(source, pageNumbers),
      pages: pageNumbers,
    },
  ];
}

/** One document per selected page. */
export async function splitEveryPage(
  bytes: Uint8Array,
  fileName: string,
  pageNumbers?: number[],
): Promise<SplitResult[]> {
  const source = await loadPdf(bytes);
  const all = pageNumbers?.length
    ? pageNumbers
    : Array.from({ length: source.getPageCount() }, (_, i) => i + 1);

  const results: SplitResult[] = [];
  for (const pageNumber of all) {
    results.push({
      fileName: `${baseName(fileName)}-page-${pageNumber}.pdf`,
      bytes: await buildFrom(source, [pageNumber]),
      pages: [pageNumber],
    });
  }
  return results;
}

/** One document per range, e.g. "1-3, 4-8". */
export async function splitByRanges(
  bytes: Uint8Array,
  fileName: string,
  ranges: number[][],
): Promise<SplitResult[]> {
  if (ranges.length === 0) throw new PdfError("Enter at least one page range.");
  const source = await loadPdf(bytes);
  const results: SplitResult[] = [];
  for (const [index, range] of ranges.entries()) {
    if (range.length === 0) continue;
    results.push({
      fileName: `${baseName(fileName)}-part-${index + 1}.pdf`,
      bytes: await buildFrom(source, range),
      pages: range,
    });
  }
  if (results.length === 0) throw new PdfError("None of those ranges matched a page in this PDF.");
  return results;
}
