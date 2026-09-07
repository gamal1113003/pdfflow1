import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("ppt-to-pdf");

export default function PptToPdfPage() {
  return <ToolPageLayout slug="ppt-to-pdf" />;
}
