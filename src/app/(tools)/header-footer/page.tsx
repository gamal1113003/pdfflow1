import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("header-footer");

export default function HeaderFooterPage() {
  return <ToolPageLayout slug="header-footer" />;
}
