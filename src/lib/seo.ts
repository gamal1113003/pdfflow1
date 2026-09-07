import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getTool } from "@/lib/tools";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
};

export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  const url = new URL(path, site.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Reusable metadata for every tool page, driven by the tool registry. */
export function toolMetadata(slug: string): Metadata {
  const tool = getTool(slug);
  return pageMetadata({
    title: tool.seo.title,
    description: tool.seo.description,
    path: `/${tool.slug}`,
  });
}

export function toolJsonLd(slug: string) {
  const tool = getTool(slug);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${site.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    url: new URL(`/${tool.slug}`, site.url).toString(),
    description: tool.seo.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
