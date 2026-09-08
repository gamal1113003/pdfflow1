import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-ppt", "ru");

export default function RuPdfToPptPage() {
  return <ToolPageLayout slug="pdf-to-ppt" locale="ru" />;
}
