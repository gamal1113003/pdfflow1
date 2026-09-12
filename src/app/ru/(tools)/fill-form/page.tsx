import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("fill-form", "ru");

export default function RuFillFormPage() {
  return <ToolPageLayout slug="fill-form" locale="ru" />;
}
