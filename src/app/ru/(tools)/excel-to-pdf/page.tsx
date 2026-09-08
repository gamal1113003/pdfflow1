import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("excel-to-pdf", "ru");

export default function RuExcelToPdfPage() {
  return <ToolPageLayout slug="excel-to-pdf" locale="ru" />;
}
