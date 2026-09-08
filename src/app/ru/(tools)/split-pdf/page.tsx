import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("split-pdf", "ru");

export default function RuSplitPdfPage() {
  return <ToolPageLayout slug="split-pdf" locale="ru" />;
}
