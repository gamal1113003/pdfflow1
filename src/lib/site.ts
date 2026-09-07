export const site = {
  name: "PDFFlow",
  tagline: "Simple tools for every PDF.",
  description:
    "Compress, convert, merge, split, edit, sign and organise your PDFs — quickly and effortlessly.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pdfflow.app",
  email: "hello@pdfflow.app",
} as const;
