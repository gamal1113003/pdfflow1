import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy — How orzix Handles Your Files",
  description:
    "How orzix handles documents, what runs in your browser, what would touch a server, and what we store.",
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
          Most orzix tools never send your document anywhere. They read it into the web page,
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
          all. If you deploy orzix with a service configured, files sent to it should be deleted
          as soon as the job finishes, and that policy should be stated here.
        </p>

        <h2>What we store</h2>
        <p>
          Your PDFs are processed temporarily and are not permanently stored. If you create an
          account, the database holds two things and nothing else:
        </p>
        <ul>
          <li>
            Your account: email address, your name if you gave one, and which plan you are on.
          </li>
          <li>
            Your usage: which tool you opened and when. The tool name and a timestamp — not the
            file, its name, its size or anything inside it.
          </li>
          <li>Your theme and language preferences, kept in your browser.</li>
        </ul>
        <p>
          There is deliberately nowhere in the database to put a document. No originals, no
          processed results, no page images, no previews, no extracted text.
        </p>
        <p>
          Where a server-side tool is used, the upload is written to a temporary directory,
          processed, returned to you, and deleted — including when the conversion fails.
        </p>
        <p>No account is required to use the browser-based tools.</p>

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
