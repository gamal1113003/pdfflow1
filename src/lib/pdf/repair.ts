"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";

/**
 * Attempting to salvage a file that will not open.
 *
 * A PDF ends with a cross-reference table listing where every object lives. If
 * a download was cut short or an editor crashed mid-write, that table is wrong
 * and readers refuse the file — even though the page content is usually all
 * still there.
 *
 * pdf-lib can be told to tolerate the damage and rebuild the structure from
 * what it finds. This does not always work, and when it does the result may be
 * missing the last page or two. It is honest about both.
 */

export type RepairResult = {
  bytes: Uint8Array;
  pages: number;
  /** What had to be given up to open it. */
  notes: string[];
};

export async function repairPdf(bytes: Uint8Array): Promise<RepairResult> {
  const notes: string[] = [];

  if (bytes.byteLength === 0) throw new PdfError("That file is empty.");

  // A PDF starts with %PDF-. Anything else is not a damaged PDF but a
  // different kind of file, and saying so saves a pointless repair attempt.
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  if (header !== "%PDF-") {
    notes.push("The file does not begin like a PDF, so this may be a different format entirely.");
  }

  let doc: PDFDocument | null = null;

  // Strictest first: if it opens cleanly there was nothing to repair, and
  // saying so is more useful than silently rewriting it.
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
    notes.push("The file opened without needing repair — it may be your reader that is at fault.");
  } catch {
    // Then tolerantly.
    try {
      doc = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
      });
      notes.push("The cross-reference table was rebuilt from the objects found in the file.");
    } catch (cause) {
      throw new PdfError(
        `This file could not be opened even with the checks relaxed. ${
          cause instanceof Error ? cause.message : ""
        } The damage may be beyond what can be recovered here.`.trim(),
      );
    }
  }

  const pageCount = doc.getPageCount();
  if (pageCount === 0) {
    throw new PdfError(
      "The file opened but contains no pages. The page objects are probably part of what was lost.",
    );
  }

  // Copying the pages into a new document discards whatever else was broken:
  // the result is written from scratch rather than patched.
  const output = await PDFDocument.create();
  let copied = 0;
  for (let index = 0; index < pageCount; index++) {
    try {
      const [page] = await output.copyPages(doc, [index]);
      output.addPage(page);
      copied++;
    } catch {
      notes.push(`Page ${index + 1} could not be recovered and has been left out.`);
    }
  }

  if (copied === 0) {
    throw new PdfError("None of the pages could be recovered.");
  }

  output.setProducer("orzix");
  return { bytes: await savePdf(output), pages: copied, notes };
}
