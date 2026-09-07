import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("rotate-pdf");

export default function RotatePdfPage() {
  return <ToolPageLayout slug="rotate-pdf" />;
}
