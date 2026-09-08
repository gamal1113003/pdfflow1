import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("ocr-pdf", "ru");

export default function RuOcrPdfPage() {
  return <ToolPageLayout slug="ocr-pdf" locale="ru" />;
}
