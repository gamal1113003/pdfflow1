import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("pages-per-sheet");

export default function PagesPerSheetPage() {
  return <ToolPageLayout slug="pages-per-sheet" />;
}
