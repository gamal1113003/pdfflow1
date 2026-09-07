import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("split-pdf");

export default function SplitPdfPage() {
  return <ToolPageLayout slug="split-pdf" />;
}
