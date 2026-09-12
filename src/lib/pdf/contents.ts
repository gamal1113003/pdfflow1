"use client";

import { PDFDocument, PDFName, PDFNumber, PDFString } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";
import { Paper } from "@/lib/pdf/paper";
import { ingestAsPdf } from "@/lib/pdf/ingest";

/**
 * Merging documents and putting a clickable index in front of them.
 *
 * The entries are real link annotations rather than drawn text, so clicking
 * one jumps to the page — which is the whole point when someone is handed a
 * 200-page bundle.
 *
 * pdf-lib has no helper for this, so the annotation dictionaries are written
 * by hand. A link is a rectangle plus a destination: the page it points at,
 * and how the reader should position it.
 */

export type ContentsEntry = { title: string; startPage: number; pages: number };

export type ContentsOptions = {
  heading: string;
  /** Adds bookmarks in the reader's sidebar as well as the printed index. */
  outline: boolean;
};

export async function mergeWithContents(
  files: File[],
  options: ContentsOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<{ bytes: Uint8Array; entries: ContentsEntry[] }> {
  if (files.length < 2) throw new PdfError("Add at least two files.");

  const merged = await PDFDocument.create();
  const entries: ContentsEntry[] = [];

  // The index is built after the documents, because until they are all in
  // place there is no way to know which page each one starts on. One page is
  // assumed for the index itself and verified afterwards.
  const reserved = 1;

  for (const [index, file] of files.entries()) {
    const ingested = await ingestAsPdf(file);
    const document = await loadPdf(ingested.bytes);
    const copied = await merged.copyPages(document, document.getPageIndices());

    entries.push({
      title: file.name.replace(/\.[^.]+$/, ""),
      startPage: merged.getPageCount() + reserved + 1,
      pages: copied.length,
    });

    copied.forEach((page) => merged.addPage(page));
    onProgress?.(index + 1, files.length);
  }

  // --- Draw the index -----------------------------------------------------
  const paper = new Paper(56);
  paper.text(options.heading, { size: 22, weight: "bold" });
  paper.gap(18);
  paper.rule();
  paper.gap(10);

  const rows: { y: number; entry: ContentsEntry }[] = [];

  for (const entry of entries) {
    paper.ensure(26);
    const y = paper.y;
    paper.text(entry.title, { size: 11, y });
    paper.text(String(entry.startPage), { size: 11, align: "right", y });
    rows.push({ y, entry });
    paper.y += 22;
    paper.rule({ color: "#f3f4f6" });
    paper.y -= 8;
  }

  const contentsBytes = await paper.toPdf();
  const contentsDoc = await loadPdf(contentsBytes);
  const contentsPages = await merged.copyPages(contentsDoc, contentsDoc.getPageIndices());

  if (contentsPages.length !== reserved) {
    // More than one index page shifts every number. Rather than print wrong
    // page numbers, the difference is added on.
    const shift = contentsPages.length - reserved;
    entries.forEach((entry) => {
      entry.startPage += shift;
    });
  }

  // Inserted at the front, in order.
  contentsPages.forEach((page, index) => merged.insertPage(index, page));

  // --- Make the entries clickable -----------------------------------------
  const indexPage = merged.getPage(0);
  const pageHeight = indexPage.getHeight();
  const annotations = rows.map(({ y, entry }) => {
    const target = merged.getPage(
      Math.min(entry.startPage - 1 + (contentsPages.length - reserved), merged.getPageCount() - 1),
    );

    return merged.context.obj({
      Type: "Annot",
      Subtype: "Link",
      // Paper measures from the top; PDF rectangles from the bottom.
      Rect: [56, pageHeight - y - 16, indexPage.getWidth() - 56, pageHeight - y + 4],
      Border: [0, 0, 0],
      C: [],
      Dest: [target.ref, PDFName.of("XYZ"), PDFNumber.of(0), PDFNumber.of(target.getHeight()), PDFNumber.of(0)],
    });
  });

  indexPage.node.set(PDFName.of("Annots"), merged.context.obj(annotations));

  // --- Sidebar bookmarks ---------------------------------------------------
  if (options.outline) {
    const outlineRef = merged.context.nextRef();
    const items = entries.map((entry) => {
      const target = merged.getPage(
        Math.min(entry.startPage - 1 + (contentsPages.length - reserved), merged.getPageCount() - 1),
      );
      return {
        ref: merged.context.nextRef(),
        title: entry.title,
        dest: [target.ref, PDFName.of("XYZ"), PDFNumber.of(0), PDFNumber.of(target.getHeight()), PDFNumber.of(0)],
      };
    });

    items.forEach((item, index) => {
      merged.context.assign(
        item.ref,
        merged.context.obj({
          Title: PDFString.of(item.title),
          Parent: outlineRef,
          Dest: item.dest,
          ...(index > 0 ? { Prev: items[index - 1].ref } : {}),
          ...(index < items.length - 1 ? { Next: items[index + 1].ref } : {}),
        }),
      );
    });

    merged.context.assign(
      outlineRef,
      merged.context.obj({
        Type: "Outlines",
        First: items[0].ref,
        Last: items[items.length - 1].ref,
        Count: items.length,
      }),
    );

    merged.catalog.set(PDFName.of("Outlines"), outlineRef);
    // Opens with the sidebar showing, or the bookmarks go unnoticed.
    merged.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
  }

  merged.setProducer("orzix");
  return { bytes: await savePdf(merged), entries };
}
