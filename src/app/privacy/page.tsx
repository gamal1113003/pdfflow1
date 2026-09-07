import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy — How PDFFlow Handles Your Files",
  description:
    "How PDFFlow handles documents, what runs in your browser, what would touch a server, and what we store.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">Privacy</h1>
        <p className="mt-4 text-muted-foreground">Last updated 4 September 2026.</p>
      </header>

      <div className="prose-page mt-10 max-w-none">
        <h2>The short version</h2>
        <p>
          Most PDFFlow tools never send your document anywhere. They read it into the web page,
          change it there, and hand the result back to you as a download. We cannot see those files
          because we never receive them.
        </p>

        <h2 id="security">Which tools run in your browser</h2>
        <p>
          Merge, split, extract, delete, reorder, rotate, edit, compress, watermark, sign, JPG to
          PDF, PNG to PDF and PDF to JPG all run locally using PDF.js and pdf-lib. Turn off your
          network connection after the page loads and they still work — that is the test.
        </p>

        <h2>Which tools would use a server</h2>
        <p>
          PDF to Word, PDF to Excel, PDF to PowerPoint, Word to PDF, Excel to PDF, PowerPoint to
          PDF, OCR, Protect PDF and Unlock PDF need processing a browser cannot do accurately. In
          this build no conversion service is connected, so those tools do not transmit anything at
          all. If you deploy PDFFlow with a service configured, files sent to it should be deleted
          as soon as the job finishes, and that policy should be stated here.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>Your theme preference, kept in your browser&apos;s local storage.</li>
          <li>No document contents, page text, file names or thumbnails.</li>
          <li>No account is required to use the browser-based tools.</li>
        </ul>

        <h2>Transport security</h2>
        <p>
          The site is served over HTTPS, so the page and its code arrive encrypted. That protects
          the delivery of the application; for local tools there is no file transfer to protect.
        </p>

        <h2>Third parties</h2>
        <p>
          We do not sell, share, index or train models on your documents. Fonts are served from the
          same origin as the site at build time.
        </p>

        <h2>Questions</h2>
        <p>
          Write to <a href={`mailto:${site.email}`}>{site.email}</a> and a person will answer.
        </p>
      </div>
    </div>
  );
}
