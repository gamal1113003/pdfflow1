import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-pdfa");

export default function PdfToPdfaPage() {
  return <ToolPageLayout slug="pdf-to-pdfa" />;
}
