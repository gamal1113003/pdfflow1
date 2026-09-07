import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-excel");

export default function PdfToExcelPage() {
  return <ToolPageLayout slug="pdf-to-excel" />;
}
