import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="py-16 sm:py-20" aria-labelledby="all-tools">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="all-tools" className="font-display text-display-sm font-semibold">
                All PDF tools
              </h2>
              <p className="mt-2 max-w-[56ch] text-muted-foreground">
                Everything you need to manage your documents in one place.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/tools">
                Browse all tools
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-10">
            <ToolGrid tools={tools} />
          </div>
        </div>
      </section>

      <HowItWorks />
    </>
  );
}
