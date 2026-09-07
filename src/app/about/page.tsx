import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About PDFFlow — Simple Tools for Every PDF",
  description:
    "PDFFlow is a browser-first PDF toolkit. Most tools run on your own device, so your documents never leave it.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">
          A PDF toolkit that does not want your files.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Most online PDF tools work by taking your document, doing something to it on a server, and
          giving it back. PDFFlow starts from the opposite assumption.
        </p>
      </header>

      <div className="prose-page mt-12 max-w-none">
        <h2>Why we built it this way</h2>
        <p>
          Browsers became capable of real document work some years ago. PDF.js can render any page,
          and pdf-lib can rewrite the file structure. Together they cover the operations people
          actually need most often — combining files, pulling pages out, straightening a scan,
          stamping a draft, adding a signature.
        </p>
        <p>
          When that work happens in the page you already have open, three problems disappear at
          once: there is no upload wait, no queue, and no copy of your contract sitting in someone
          else&apos;s storage bucket.
        </p>

        <h2>What we are honest about</h2>
        <p>
          Some things genuinely cannot be done well in a browser. Converting a PDF into an editable
          Word file needs a layout engine and font substitution logic. OCR needs a trained model.
          Encrypting a PDF with a password is not something pdf-lib supports at all.
        </p>
        <p>
          Rather than shipping a poor imitation, those tools tell you plainly that they need a
          processing service, and stop. We would rather send you elsewhere than hand back a broken
          document.
        </p>

        <h2>Who it is for</h2>
        <p>
          People who occasionally need a PDF fixed and do not want to learn software to do it: a
          scanned form that came in sideways, a report that needs two files stitched together, a
          lease that needs a signature before five o&apos;clock.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/tools">Explore PDF tools</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/contact">Get in touch</Link>
        </Button>
      </div>
    </div>
  );
}
