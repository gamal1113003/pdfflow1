import type { Metadata } from "next";
import { ToolsExplorer } from "@/components/tools/ToolsExplorer";
import { pageMetadata } from "@/lib/seo";
import { tools, type ToolCategory } from "@/lib/tools";

export const metadata: Metadata = pageMetadata({
  title: "All PDF Tools — Convert, Compress, Edit and Sign | PDFFlow",
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
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">All PDF tools</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {tools.length} tools for reading, fixing, converting and signing documents. Most of them
          run entirely in your browser.
        </p>
      </header>

      <div className="mt-12">
        <ToolsExplorer initialCategory={initialCategory} />
      </div>
    </div>
  );
}
