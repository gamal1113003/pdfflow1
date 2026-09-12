import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("scan-to-pdf", "ru");

export default function RuScanToPdfPage() {
  return <ToolPageLayout slug="scan-to-pdf" locale="ru" />;
}
