import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("header-footer", "ru");

export default function RuHeaderFooterPage() {
  return <ToolPageLayout slug="header-footer" locale="ru" />;
}
