import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("compare-pdf");

export default function ComparePdfPage() {
  return <ToolPageLayout slug="compare-pdf" />;
}
