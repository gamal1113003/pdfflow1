import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("png-to-pdf");

export default function PngToPdfPage() {
  return <ToolPageLayout slug="png-to-pdf" />;
}
