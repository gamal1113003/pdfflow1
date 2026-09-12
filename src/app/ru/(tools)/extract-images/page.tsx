import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("extract-images", "ru");

export default function RuExtractImagesPage() {
  return <ToolPageLayout slug="extract-images" locale="ru" />;
}
