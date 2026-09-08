import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("annotate-pdf", "ru");

export default function RuAnnotatePdfPage() {
  return <ToolPageLayout slug="annotate-pdf" locale="ru" />;
}
