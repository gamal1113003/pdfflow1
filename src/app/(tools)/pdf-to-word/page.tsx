import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-word");

export default function PdfToWordPage() {
  return <ToolPageLayout slug="pdf-to-word" />;
}
