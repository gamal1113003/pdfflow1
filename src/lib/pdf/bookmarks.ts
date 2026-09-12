"use client";

import { PDFDocument } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { openDocument } from "@/lib/pdf/render";

/**
 * Splitting a document at its bookmarks.
 *
 * A PDF's outline is a tree of named destinations. Turning one into a page
 * number means resolving that destination, which PDF.js does — pdf-lib has no
 * access to the outline at all. So the structure is read with one library and
 * the splitting done with the other.
 */

export type Bookmark = {
  title: string;
  /** 1-based. */
  page: number;
  depth: number;
};

type OutlineNode = {
  title: string;
  dest: string | unknown[] | null;
  items: OutlineNode[];
};

export async function readBookmarks(bytes: Uint8Array): Promise<Bookmark[]> {
  const doc = await openDocument(bytes);
  try {
    const outline = (await doc.getOutline()) as OutlineNode[] | null;
    if (!outline || outline.length === 0) {
      throw new PdfError(
        "This document has no bookmarks. Split PDF lets you choose page ranges by hand instead.",
      );
    }

    const found: Bookmark[] = [];

    const walk = async (nodes: OutlineNode[], depth: number) => {
      for (const node of nodes) {
        try {
          // A destination is either a named one that needs looking up, or an
          // explicit array whose first entry is a page reference.
          const destination =
            typeof node.dest === "string" ? await doc.getDestination(node.dest) : node.dest;

          if (Array.isArray(destination) && destination[0]) {
            const index = await doc.getPageIndex(destination[0] as never);
            found.push({ title: node.title || "Untitled", page: index + 1, depth });
          }
        } catch {
          // A bookmark pointing nowhere is skipped rather than failing the lot.
        }
        if (node.items?.length) await walk(node.items, depth + 1);
      }
    };

    await walk(outline, 0);

    if (found.length === 0) {
      throw new PdfError("The bookmarks in this document do not point at any pages.");
    }

    // Sorted, because an outline can list sections out of page order.
    return found.sort((a, b) => a.page - b.page);
  } finally {
    await doc.destroy();
  }
}

export type SplitPart = { fileName: string; bytes: Uint8Array; title: string; pages: number };

export async function splitAtBookmarks(
  bytes: Uint8Array,
  chosen: Bookmark[],
  baseName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<SplitPart[]> {
  if (chosen.length === 0) throw new PdfError("Choose at least one bookmark to split at.");

  const source = await loadPdf(bytes);
  const total = source.getPageCount();
  const parts: SplitPart[] = [];

  const points = [...chosen].sort((a, b) => a.page - b.page);

  // Anything before the first chosen bookmark becomes its own part, so no
  // pages are quietly lost.
  if (points[0].page > 1) {
    points.unshift({ title: "Beginning", page: 1, depth: 0 });
  }

  for (const [index, point] of points.entries()) {
    const from = point.page - 1;
    const to = index + 1 < points.length ? points[index + 1].page - 1 : total;
    if (to <= from) continue;

    const output = await PDFDocument.create();
    const copied = await output.copyPages(
      source,
      Array.from({ length: to - from }, (_, offset) => from + offset),
    );
    copied.forEach((page) => output.addPage(page));
    output.setTitle(point.title);
    output.setProducer("orzix");

    const safe = point.title
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || `part-${index + 1}`;

    parts.push({
      fileName: `${baseName}-${String(index + 1).padStart(2, "0")}-${safe}.pdf`,
      bytes: await savePdf(output),
      title: point.title,
      pages: to - from,
    });

    onProgress?.(index + 1, points.length);
  }

  return parts;
}
