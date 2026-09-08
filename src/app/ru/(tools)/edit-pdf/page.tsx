import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("edit-pdf", "ru");

export default function RuEditPdfPage() {
  return <ToolPageLayout slug="edit-pdf" locale="ru" />;
}
