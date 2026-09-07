import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("unlock-pdf");

export default function UnlockPdfPage() {
  return <ToolPageLayout slug="unlock-pdf" />;
}
