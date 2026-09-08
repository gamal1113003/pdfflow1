import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("translate-pdf", "ru");

export default function RuTranslatePdfPage() {
  return <ToolPageLayout slug="translate-pdf" locale="ru" />;
}
