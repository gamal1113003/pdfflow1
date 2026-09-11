import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("blacken-pdf", "ru");

export default function RuBlackenPdfPage() {
  return <ToolPageLayout slug="blacken-pdf" locale="ru" />;
}
