import { degrees } from "pdf-lib";
import { PDFDocument } from "pdf-lib";
import { loadPdf, savePdf } from "@/lib/pdf/document";

/** One page in the working document, pointing back at a page of the original. */
export type PagePlan = {
  id: string;
  /** 0-based index in the source PDF. */
  sourceIndex: number;
  /** Extra rotation in degrees, relative to the source page. */
  rotation: number;
};

/**
 * Rebuilds a PDF from a page plan. Deleting, reordering, duplicating, rotating
 * and extracting are all the same operation on a different plan.
 */
export async function applyPagePlan(bytes: Uint8Array, plan: PagePlan[]): Promise<Uint8Array> {
  const source = await loadPdf(bytes);
  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    plan.map((entry) => entry.sourceIndex),
  );

  copied.forEach((page, index) => {
    const rotation = plan[index].rotation;
    if (rotation) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((((current + rotation) % 360) + 360) % 360));
    }
    output.addPage(page);
  });

  output.setProducer("orzix");
  output.setCreator("orzix");
  return savePdf(output);
}

export function planFromPageCount(pageCount: number): PagePlan[] {
  return Array.from({ length: pageCount }, (_, index) => ({
    id: `p${index}-${Math.random().toString(36).slice(2, 8)}`,
    sourceIndex: index,
    rotation: 0,
  }));
}
