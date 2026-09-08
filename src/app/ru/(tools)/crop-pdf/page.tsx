import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("crop-pdf", "ru");

export default function RuCropPdfPage() {
  return <ToolPageLayout slug="crop-pdf" locale="ru" />;
}
