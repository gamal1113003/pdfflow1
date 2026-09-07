import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service | orzix",
  description: "The terms that apply when you use orzix's online PDF tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">Terms of service</h1>
        <p className="mt-4 text-muted-foreground">Last updated 4 September 2026.</p>
      </header>

      <div className="prose-page mt-10 max-w-none">
        <h2>Using orzix</h2>
        <p>
          You may use these tools for any lawful purpose. You keep all rights to the documents you
          work on; using orzix gives us no claim over them.
        </p>

        <h2>Your responsibilities</h2>
        <ul>
          <li>Only process documents you own or have permission to modify.</li>
          <li>
            Only remove password protection from a document where you are authorised to do so.
          </li>
          <li>Do not use the service to infringe copyright or to break the law.</li>
        </ul>

        <h2>Signatures</h2>
        <p>
          The Sign PDF tool places a visible signature image on the page. It is not a cryptographic
          digital signature and does not by itself prove who signed a document. If you need a
          qualified electronic signature, use a certified provider.
        </p>

        <h2>No warranty</h2>
        <p>
          The tools are provided as they are. Document processing can fail on damaged or unusual
          files. Keep a copy of your original before making changes — we cannot recover a file we
          never had.
        </p>

        <h2>Liability</h2>
        <p>
          To the extent the law allows, we are not liable for lost data, lost profits or indirect
          damages arising from use of the service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. Material changes will be noted on this page with a new date.
          Questions go to <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </div>
  );
}
