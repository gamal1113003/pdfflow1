import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("reorder-pages", "ru");

export default function RuReorderPagesPage() {
  return <ToolPageLayout slug="reorder-pages" locale="ru" />;
}
