import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("poster");

export default function PosterPage() {
  return <ToolPageLayout slug="poster" />;
}
