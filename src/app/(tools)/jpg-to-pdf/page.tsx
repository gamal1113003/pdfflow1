import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("jpg-to-pdf");

export default function JpgToPdfPage() {
  return <ToolPageLayout slug="jpg-to-pdf" />;
}
