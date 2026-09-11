import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("blacken-pdf");

export default function BlackenPdfPage() {
  return <ToolPageLayout slug="blacken-pdf" />;
}
