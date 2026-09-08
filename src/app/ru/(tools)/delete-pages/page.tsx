import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("delete-pages", "ru");

export default function RuDeletePagesPage() {
  return <ToolPageLayout slug="delete-pages" locale="ru" />;
}
