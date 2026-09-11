import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata("qr-code", "ru");

export default function RuQrCodePage() {
  return <ToolPageLayout slug="qr-code" locale="ru" />;
}
