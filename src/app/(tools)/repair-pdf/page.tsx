import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("repair-pdf");

export default function RepairPdfPage() {
  return <ToolPageLayout slug="repair-pdf" />;
}
