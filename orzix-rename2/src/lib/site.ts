export const site = {
  name: "orzix",
  tagline: "Simple tools for every PDF.",
  description:
    "Compress, convert, merge, split, edit, sign and organise your PDFs — quickly and effortlessly.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://orzix.app",
  email: "hello@orzix.app",
} as const;
