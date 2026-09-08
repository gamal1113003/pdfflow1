import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-jpg", "ru");

export default function RuPdfToJpgPage() {
  return <ToolPageLayout slug="pdf-to-jpg" locale="ru" />;
}
