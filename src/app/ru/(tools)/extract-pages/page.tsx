import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("extract-pages", "ru");

export default function RuExtractPagesPage() {
  return <ToolPageLayout slug="extract-pages" locale="ru" />;
}
