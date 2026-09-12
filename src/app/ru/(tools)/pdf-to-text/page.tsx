import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-text", "ru");

export default function RuPdfToTextPage() {
  return <ToolPageLayout slug="pdf-to-text" locale="ru" />;
}
