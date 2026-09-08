import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("ppt-to-pdf", "ru");

export default function RuPptToPdfPage() {
  return <ToolPageLayout slug="ppt-to-pdf" locale="ru" />;
}
