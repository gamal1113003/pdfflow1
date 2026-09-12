import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-text");

export default function PdfToTextPage() {
  return <ToolPageLayout slug="pdf-to-text" />;
}
