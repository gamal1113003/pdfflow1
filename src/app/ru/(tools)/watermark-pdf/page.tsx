import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("watermark-pdf", "ru");

export default function RuWatermarkPdfPage() {
  return <ToolPageLayout slug="watermark-pdf" locale="ru" />;
}
