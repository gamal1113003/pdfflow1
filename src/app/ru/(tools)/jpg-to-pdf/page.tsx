import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("jpg-to-pdf", "ru");

export default function RuJpgToPdfPage() {
  return <ToolPageLayout slug="jpg-to-pdf" locale="ru" />;
}
