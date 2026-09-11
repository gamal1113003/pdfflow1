import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("job-application", "ru");

export default function RuJobApplicationPage() {
  return <ToolPageLayout slug="job-application" locale="ru" />;
}
