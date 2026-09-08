import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("sign-pdf", "ru");

export default function RuSignPdfPage() {
  return <ToolPageLayout slug="sign-pdf" locale="ru" />;
}
