import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("merge-pdf");

export default function MergePdfPage() {
  return <ToolPageLayout slug="merge-pdf" />;
}
