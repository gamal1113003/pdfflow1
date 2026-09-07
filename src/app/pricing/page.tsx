import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/home/Pricing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing — Free, Pro and Business Plans | PDFFlow",
  description:
    "PDFFlow is free for browser-based PDF tools. Upgrade to Pro for unlimited processing and larger files, or Business for team features.",
  path: "/pricing",
});

const FAQ = [
  {
    q: "What do I actually get for free?",
    a: "Every tool that runs in your browser, with no account: merge, split, rotate, reorder, delete and extract pages, compress, watermark, sign, and image conversion both ways.",
  },
  {
    q: "Why do the paid plans exist at all?",
    a: "Server-side work costs money to run. OCR and Office conversion need real machines, and higher limits need capacity. The browser tools cost us nothing per use, so they stay free.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, at any time. Your plan stays active until the end of the period you have paid for, then drops back to Free.",
  },
];

export default function PricingPage() {
  return (
    <>
      <div className="container py-14 sm:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-display-md font-semibold">
            Pay only for what needs a server.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The everyday tools are free because they run on your own machine. Plans cover the
            heavier work and the things teams need.
          </p>
        </header>

        <div className="mt-12">
          <Pricing />
        </div>
      </div>

      <section className="border-t border-border bg-card py-16" aria-labelledby="pricing-faq">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="pricing-faq" className="font-display text-display-sm font-semibold">
              Before you pay
            </h2>
            <p className="mt-3 max-w-[40ch] leading-relaxed text-muted-foreground">
              Still unsure which plan fits?{" "}
              <Link href="/contact" className="font-medium text-primary hover:underline">
                Ask us
              </Link>{" "}
              and we will tell you honestly if Free is enough.
            </p>
          </div>
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQ.map((entry, index) => (
              <AccordionItem key={entry.q} value={`pricing-${index}`}>
                <AccordionTrigger>{entry.q}</AccordionTrigger>
                <AccordionContent>{entry.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
