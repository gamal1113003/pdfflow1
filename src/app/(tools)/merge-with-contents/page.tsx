import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("merge-with-contents");

export default function MergeWithContentsPage() {
  return <ToolPageLayout slug="merge-with-contents" />;
}
