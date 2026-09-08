import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("rotate-pdf", "ru");

export default function RuRotatePdfPage() {
  return <ToolPageLayout slug="rotate-pdf" locale="ru" />;
}
