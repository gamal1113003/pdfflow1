import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-pdfa", "ru");

export default function RuPdfToPdfaPage() {
  return <ToolPageLayout slug="pdf-to-pdfa" locale="ru" />;
}
