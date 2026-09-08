import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("flatten-pdf", "ru");

export default function RuFlattenPdfPage() {
  return <ToolPageLayout slug="flatten-pdf" locale="ru" />;
}
