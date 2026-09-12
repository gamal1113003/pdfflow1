import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("page-numbers", "ru");

export default function RuPageNumbersPage() {
  return <ToolPageLayout slug="page-numbers" locale="ru" />;
}
