import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("repair-pdf", "ru");

export default function RuRepairPdfPage() {
  return <ToolPageLayout slug="repair-pdf" locale="ru" />;
}
