import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("fill-form");

export default function FillFormPage() {
  return <ToolPageLayout slug="fill-form" />;
}
