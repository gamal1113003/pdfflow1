import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("poster", "ru");

export default function RuPosterPage() {
  return <ToolPageLayout slug="poster" locale="ru" />;
}
