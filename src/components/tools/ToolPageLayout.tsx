import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { toolJsonLd } from "@/lib/seo";
import { getTool, tools } from "@/lib/tools";

export function ToolPageLayout({ slug }: { slug: string }) {
  const tool = getTool(slug);
  const related = tools
    .filter((item) => item.slug !== tool.slug)
    .filter((item) => item.categories.some((category) => tool.categories.includes(category)))
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(slug)) }}
      />

      <div className="container pb-20 pt-8 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <li>
              <Link href="/tools" className="transition-colors hover:text-foreground">
                Tools
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <li aria-current="page" className="text-foreground">
              {tool.name}
            </li>
          </ol>
        </nav>

        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-display-md font-semibold text-foreground">{tool.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{tool.lede}</p>
        </header>

        <div className="mx-auto mt-10 max-w-4xl">
          <ToolWorkspace tool={tool} />
        </div>

        <p className="mx-auto mt-8 flex max-w-4xl items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden="true" />
          {tool.runsInBrowser
            ? "This tool runs entirely in your browser. Your file never leaves your device."
            : "This tool needs a processing server. See the note in the tool for details."}
        </p>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-card py-16" aria-labelledby="related-tools">
          <div className="container">
            <h2 id="related-tools" className="font-display text-display-sm font-semibold">
              People also use
            </h2>
            <p className="mt-2 text-muted-foreground">
              Other tools that pair well with {tool.name}.
            </p>
            <div className="mt-8">
              <ToolGrid tools={related} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
