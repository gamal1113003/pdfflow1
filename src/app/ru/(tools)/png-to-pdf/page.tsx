import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("png-to-pdf", "ru");

export default function RuPngToPdfPage() {
  return <ToolPageLayout slug="png-to-pdf" locale="ru" />;
}
