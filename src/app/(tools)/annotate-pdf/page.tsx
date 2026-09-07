import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("annotate-pdf");

export default function AnnotatePdfPage() {
  return <ToolPageLayout slug="annotate-pdf" />;
}
