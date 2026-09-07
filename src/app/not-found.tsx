import Link from "next/link";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { popularTools } from "@/lib/tools";

export default function NotFound() {
  return (
    <div className="container py-20 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-display text-sm font-medium text-primary">404</p>
        <h1 className="mt-3 font-display text-display-md font-semibold">
          That page is not here.
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The link may be out of date. Every tool is one click away from the tools page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/tools">Browse all tools</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-6 text-center font-display text-lg font-semibold">Popular right now</h2>
        <ToolGrid tools={popularTools.slice(0, 8)} />
      </div>
    </div>
  );
}
