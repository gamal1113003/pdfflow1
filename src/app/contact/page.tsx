import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact PDFFlow — Support and Enquiries",
  description:
    "Questions about a tool, a plan or your account? Send the PDFFlow team a message and we will get back to you.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container py-14 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <header>
          <h1 className="font-display text-display-md font-semibold">Talk to us</h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
            Tell us what you were trying to do and what happened instead. Real answers, usually
            within a working day.
          </p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="font-display text-[1.05rem] font-semibold">Email</dt>
              <dd className="mt-1 text-muted-foreground">
                <a
                  href={`mailto:${site.email}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {site.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-display text-[1.05rem] font-semibold">Something went wrong?</dt>
              <dd className="mt-1 max-w-[46ch] text-muted-foreground">
                Include the tool name and roughly how big the file was. Do not send us the document
                itself — we almost never need it, and we would rather not have it.
              </dd>
            </div>
          </dl>
        </header>

        <ContactForm />
      </div>
    </div>
  );
}
