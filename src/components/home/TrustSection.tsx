import { Cpu, Eye, Lock, Trash2 } from "lucide-react";

const POINTS = [
  {
    Icon: Cpu,
    title: "Processed on your device",
    body: "Merging, splitting, rotating, compressing, watermarking and signing all run in your browser using pdf-lib and PDF.js. The file is never sent anywhere.",
  },
  {
    Icon: Trash2,
    title: "Nothing is stored",
    body: "Your document lives in the page's memory while you work on it and disappears the moment you close or reload the tab.",
  },
  {
    Icon: Lock,
    title: "Encrypted in transit",
    body: "The site is served over HTTPS. The few tools that need a server, such as OCR and Office conversion, say so plainly before you start.",
  },
  {
    Icon: Eye,
    title: "No document mining",
    body: "We do not read, index, train on or sell your documents. There is nothing to sell, because for most tools we never receive them.",
  },
];

export function TrustSection() {
  return (
    <section
      id="privacy"
      className="border-b border-border bg-card py-16 sm:py-20"
      aria-labelledby="privacy-heading"
    >
      <div className="container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h2 id="privacy-heading" className="font-display text-display-sm font-semibold">
            Your documents stay private.
          </h2>
          <p className="mt-4 max-w-[54ch] leading-relaxed text-muted-foreground">
            Contracts, invoices, medical letters — the things people put through a PDF tool are
            rarely trivial. So most of PDFFlow was built to work without ever seeing your file.
          </p>
        </div>

        <dl className="grid gap-8 sm:grid-cols-2">
          {POINTS.map((point) => (
            <div key={point.title}>
              <dt className="flex items-center gap-2.5 font-display text-[1.05rem] font-semibold">
                <point.Icon className="size-5 text-primary" aria-hidden="true" />
                {point.title}
              </dt>
              <dd className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
