import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolsExplorer } from "@/components/tools/ToolsExplorer";
import { ToolsHeading } from "@/components/tools/ToolsHeading";
import { pageMetadata } from "@/lib/seo";
import { tools, type ToolCategory } from "@/lib/tools";

export const metadata: Metadata = pageMetadata({
  title: "All PDF Tools — Convert, Compress, Edit and Sign | orzix",
  description:
    "Browse every PDF tool in one place: compress, merge, split, convert, rotate, watermark, sign and protect your documents.",
  path: "/tools",
});

const VALID = new Set<string>([
  "convert-from-pdf",
  "convert-to-pdf",
  "compress",
  "organize",
  "edit",
  "security",
  "image",
]);

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory: ToolCategory | "all" =
    category && VALID.has(category) ? (category as ToolCategory) : "all";

  return (
    <div className="container py-14 sm:py-16">
      <ToolsHeading count={tools.length} />

      <div className="mt-12">
        {/* useSearchParams needs a boundary so the shell can render first. */}
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <ToolsExplorer initialCategory={initialCategory} />
        </Suspense>
      </div>
    </div>
  );
}
