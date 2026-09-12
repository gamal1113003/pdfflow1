import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("split-by-bookmarks");

export default function SplitByBookmarksPage() {
  return <ToolPageLayout slug="split-by-bookmarks" />;
}
