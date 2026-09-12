import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("page-numbers");

export default function PageNumbersPage() {
  return <ToolPageLayout slug="page-numbers" />;
}
