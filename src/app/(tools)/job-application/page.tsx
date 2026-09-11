import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("job-application");

export default function JobApplicationPage() {
  return <ToolPageLayout slug="job-application" />;
}
