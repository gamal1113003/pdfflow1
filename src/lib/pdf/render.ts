"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { copyBytes, PdfError } from "@/lib/pdf/document";

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

/** Loads pdf.js lazily so it never ends up in the server bundle. */
export async function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Served as a static file from /public rather than resolved through
      // `new URL(..., import.meta.url)`. The bundler rewrite of that pattern
      // is fragile in Next.js and fails at runtime with
      // "__webpack_require__.U is not a constructor".
      //
      // The file must be copied into /public whenever pdfjs-dist is updated:
      //   copy node_modules\pdfjs-dist\build\pdf.worker.min.mjs public\
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function openDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  try {
    return await pdfjs.getDocument({
      data: copyBytes(bytes),

      // Documents that rely on the standard 14 fonts — Helvetica, Times and
      // the rest — do not embed them, so PDF.js needs its own copies to draw
      // the page. Without this it warns and renders nothing.
      //
      // The files must be copied into /public whenever pdfjs-dist is updated:
      //   robocopy node_modules\pdfjs-dist\standard_fonts public\standard_fonts /E
      standardFontDataUrl: "/standard_fonts/",

      // --- Security hardening -------------------------------------------
      // A PDF is untrusted input. These options remove the paths a crafted
      // document could use to reach outside the page.

      // Never compile PDF-supplied code. This closes the class of bug behind
      // CVE-2024-4367, where a malicious font could run arbitrary JavaScript.
      isEvalSupported: false,

      // Ignore JavaScript actions embedded in the document.
      enableXfa: false,

      // Do not let the document pull in fonts or resources over the network;
      // fall back to the bundled standard fonts instead.
      useSystemFonts: false,

      // Everything is already in memory, so never issue range requests.
      disableAutoFetch: true,
      disableStream: true,
      // -------------------------------------------------------------------
    }).promise;
  } catch {
    throw new PdfError("This PDF could not be opened for preview.");
  }
}

export type RenderOptions = {
  /** Longest edge of the produced bitmap, in CSS pixels. */
  maxEdge?: number;
  quality?: number;
  type?: "image/jpeg" | "image/png";
  /** Extra rotation applied on top of the page's own rotation. */
  rotation?: number;
};

export type RenderedPage = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<RenderedPage> {
  const { maxEdge = 320, quality = 0.82, type = "image/jpeg", rotation = 0 } = options;
  const page = await doc.getPage(pageNumber);
  const angle = (((page.rotate + rotation) % 360) + 360) % 360;
  const base = page.getViewport({ scale: 1, rotation: angle });
  const scale = Math.min(maxEdge / Math.max(base.width, base.height), 4);
  const viewport = page.getViewport({ scale: Math.max(scale, 0.1), rotation: angle });

  const canvas = document.createElement("canvas");
  const ratio = type === "image/png" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
  canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new PdfError("Your browser could not render this page.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(ratio, ratio);

  await page.render({ canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL(type, quality);
  page.cleanup();
  return { dataUrl, width: viewport.width, height: viewport.height };
}

/** Renders thumbnails one page at a time so long documents stay responsive. */
export async function renderThumbnails(
  bytes: Uint8Array,
  onPage: (pageNumber: number, page: RenderedPage) => void,
  options: RenderOptions & { signal?: AbortSignal } = {},
): Promise<number> {
  const doc = await openDocument(bytes);
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      if (options.signal?.aborted) break;
      onPage(pageNumber, await renderPage(doc, pageNumber, options));
      // Yield to the event loop so the UI can paint between pages.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return doc.numPages;
  } finally {
    await doc.destroy();
  }
}
