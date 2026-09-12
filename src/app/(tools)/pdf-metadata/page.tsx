import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-metadata");

export default function PdfMetadataPage() {
  return <ToolPageLayout slug="pdf-metadata" />;
}
