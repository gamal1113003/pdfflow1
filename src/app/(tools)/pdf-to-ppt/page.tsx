import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-ppt");

export default function PdfToPptPage() {
  return <ToolPageLayout slug="pdf-to-ppt" />;
}
