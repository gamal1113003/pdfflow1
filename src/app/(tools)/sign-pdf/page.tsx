import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("sign-pdf");

export default function SignPdfPage() {
  return <ToolPageLayout slug="sign-pdf" />;
}
