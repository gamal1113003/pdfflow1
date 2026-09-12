"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Tool, ToolWidget } from "@/lib/tools";
import { TrackToolUsage } from "@/components/tools/TrackToolUsage";

const loading = () => (
  <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/50" />
);

/**
 * PDF work happens in the browser, so every widget is client-only and loaded
 * on demand — the marketing pages never pay for pdf.js or pdf-lib.
 */
const WIDGETS: Record<ToolWidget, ComponentType<{ tool: Tool }>> = {
  compress: dynamic(() => import("@/components/widgets/CompressWidget").then((m) => m.CompressWidget), { ssr: false, loading }),
  merge: dynamic(() => import("@/components/widgets/MergeWidget").then((m) => m.MergeWidget), { ssr: false, loading }),
  split: dynamic(() => import("@/components/widgets/SplitWidget").then((m) => m.SplitWidget), { ssr: false, loading }),
  organize: dynamic(() => import("@/components/widgets/OrganizeWidget").then((m) => m.OrganizeWidget), { ssr: false, loading }),
  "images-to-pdf": dynamic(() => import("@/components/widgets/ImagesToPdfWidget").then((m) => m.ImagesToPdfWidget), { ssr: false, loading }),
  "pdf-to-images": dynamic(() => import("@/components/widgets/PdfToImagesWidget").then((m) => m.PdfToImagesWidget), { ssr: false, loading }),
  watermark: dynamic(() => import("@/components/widgets/WatermarkWidget").then((m) => m.WatermarkWidget), { ssr: false, loading }),
  "edit-content": dynamic(() => import("@/components/widgets/EditContentWidget").then((m) => m.EditContentWidget), { ssr: false, loading }),
  scan: dynamic(() => import("@/components/widgets/ScanWidget").then((m) => m.ScanWidget), { ssr: false, loading }),
  "fill-form": dynamic(() => import("@/components/widgets/FillFormWidget").then((m) => m.FillFormWidget), { ssr: false, loading }),
  "page-numbers": dynamic(() => import("@/components/widgets/PageNumbersWidget").then((m) => m.PageNumbersWidget), { ssr: false, loading }),
  "pdf-to-text": dynamic(() => import("@/components/widgets/PdfToTextWidget").then((m) => m.PdfToTextWidget), { ssr: false, loading }),
  "extract-images": dynamic(() => import("@/components/widgets/ExtractImagesWidget").then((m) => m.ExtractImagesWidget), { ssr: false, loading }),
  "pages-per-sheet": dynamic(() => import("@/components/widgets/PagesPerSheetWidget").then((m) => m.PagesPerSheetWidget), { ssr: false, loading }),
  metadata: dynamic(() => import("@/components/widgets/MetadataWidget").then((m) => m.MetadataWidget), { ssr: false, loading }),
  "image-optimise": dynamic(() => import("@/components/widgets/ImageOptimiseWidget").then((m) => m.ImageOptimiseWidget), { ssr: false, loading }),
  qr: dynamic(() => import("@/components/widgets/QrWidget").then((m) => m.QrWidget), { ssr: false, loading }),
  invoice: dynamic(() => import("@/components/widgets/InvoiceWidget").then((m) => m.InvoiceWidget), { ssr: false, loading }),
  application: dynamic(() => import("@/components/widgets/ApplicationWidget").then((m) => m.ApplicationWidget), { ssr: false, loading }),
  redact: dynamic(() => import("@/components/widgets/RedactWidget").then((m) => m.RedactWidget), { ssr: false, loading }),
  compare: dynamic(() => import("@/components/widgets/CompareWidget").then((m) => m.CompareWidget), { ssr: false, loading }),
  crop: dynamic(() => import("@/components/widgets/CropWidget").then((m) => m.CropWidget), { ssr: false, loading }),
  sign: dynamic(() => import("@/components/widgets/SignWidget").then((m) => m.SignWidget), { ssr: false, loading }),
  translate: dynamic(() => import("@/components/widgets/TranslateWidget").then((m) => m.TranslateWidget), { ssr: false, loading }),
  "ocr-local": dynamic(() => import("@/components/widgets/OcrLocalWidget").then((m) => m.OcrLocalWidget), { ssr: false, loading }),
  backend: dynamic(() => import("@/components/widgets/BackendWidget").then((m) => m.BackendWidget), { ssr: false, loading }),
};

export function ToolWorkspace({ tool }: { tool: Tool }) {
  const Widget = WIDGETS[tool.widget];
  return (
    <>
      <TrackToolUsage slug={tool.slug} />
      <Widget tool={tool} />
    </>
  );
}
