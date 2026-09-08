import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("merge-pdf", "ru");

export default function RuMergePdfPage() {
  return <ToolPageLayout slug="merge-pdf" locale="ru" />;
}
