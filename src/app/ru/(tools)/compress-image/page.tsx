import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("compress-image", "ru");

export default function RuCompressImagePage() {
  return <ToolPageLayout slug="compress-image" locale="ru" />;
}
