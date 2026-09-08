import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("unlock-pdf", "ru");

export default function RuUnlockPdfPage() {
  return <ToolPageLayout slug="unlock-pdf" locale="ru" />;
}
