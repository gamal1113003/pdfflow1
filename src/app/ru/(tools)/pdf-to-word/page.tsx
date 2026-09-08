import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pdf-to-word", "ru");

export default function RuPdfToWordPage() {
  return <ToolPageLayout slug="pdf-to-word" locale="ru" />;
}
