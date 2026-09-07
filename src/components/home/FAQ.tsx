import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [
  {
    q: "Is PDFFlow free?",
    a: "Yes. Every tool that runs in your browser — merging, splitting, rotating, compressing, watermarking, signing and image conversion — is free to use with no account. Paid plans add higher limits and the server-side conversions.",
  },
  {
    q: "Are my files secure?",
    a: "For browser-based tools your file never leaves your device: it is read into the page, edited there and handed straight back to you as a download. The tools that genuinely need a server tell you before you start.",
  },
  {
    q: "How large can my PDF be?",
    a: "Up to 100 MB. Because the work happens in your browser, the practical limit is your device's memory — a 300-page scan will be slower on a phone than on a laptop.",
  },
  {
    q: "Can I merge multiple PDFs?",
    a: "Yes. Add as many files as you like on the Merge PDF page, drag them into the order you want, and download one combined document.",
  },
  {
    q: "Can I compress PDFs without losing quality?",
    a: "Basic compression is lossless — it rewrites the file structure and strips metadata, so text and links are untouched. Strong and Extreme redraw each page as an image, which shrinks scans a lot but removes selectable text. The tool says which one you picked.",
  },
  {
    q: "Can I convert PDF to Word?",
    a: "PDF to Word needs a server-side layout engine to be accurate, so it is not a browser job. The page is built and ready, and connects to a conversion service through a single configuration value.",
  },
  {
    q: "Can I use PDFFlow on mobile?",
    a: "Yes. The interface adapts to small screens and the upload areas accept files from your phone. Very large documents are limited by the memory your phone gives the browser.",
  },
  {
    q: "How long are uploaded files stored?",
    a: "Browser tools store nothing at all — closing the tab is the deletion. Where a server is involved, the file is deleted as soon as the conversion finishes.",
  },
  {
    q: "Do I need an account?",
    a: "No. Every browser-based tool works without signing in. An account only matters for higher limits, team features and billing.",
  },
];

export function FAQ() {
  return (
    <section className="border-b border-border py-16 sm:py-20" aria-labelledby="faq-heading">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 id="faq-heading" className="font-display text-display-sm font-semibold">
            Questions people ask
          </h2>
          <p className="mt-3 max-w-[42ch] leading-relaxed text-muted-foreground">
            If something here is unclear, ask us directly — we answer in plain language.
          </p>
        </div>

        <Accordion type="single" collapsible className="border-t border-border">
          {QUESTIONS.map((entry, index) => (
            <AccordionItem key={entry.q} value={`item-${index}`}>
              <AccordionTrigger>{entry.q}</AccordionTrigger>
              <AccordionContent>{entry.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
