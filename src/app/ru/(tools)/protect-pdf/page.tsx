import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("protect-pdf", "ru");

export default function RuProtectPdfPage() {
  return <ToolPageLayout slug="protect-pdf" locale="ru" />;
}
