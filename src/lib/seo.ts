import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getTool } from "@/lib/tools";
import type { Language } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, LOCALES, pathFor } from "@/lib/i18n/locale";
import { translateToolSeo } from "@/lib/i18n/toolStrings";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  locale?: Language;
};

/**
 * Builds the alternates block that tells search engines the English and
 * Russian pages are the same document in two languages. Without hreflang the
 * two look like duplicates competing with each other.
 */
function alternatesFor(path: string, locale: Language) {
  const languages: Record<string, string> = {};
  for (const entry of LOCALES) {
    languages[entry] = new URL(pathFor(entry, path), site.url).toString();
  }
  languages["x-default"] = new URL(pathFor(DEFAULT_LOCALE, path), site.url).toString();

  return {
    canonical: new URL(pathFor(locale, path), site.url).toString(),
    languages,
  };
}

export function pageMetadata({
  title,
  description,
  path,
  locale = DEFAULT_LOCALE,
}: PageMetaInput): Metadata {
  const url = new URL(pathFor(locale, path), site.url).toString();
  return {
    title,
    description,
    alternates: alternatesFor(path, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Reusable metadata for every tool page, in either language. */
export function toolMetadata(slug: string, locale: Language = DEFAULT_LOCALE): Metadata {
  const tool = getTool(slug);
  const seo = translateToolSeo(locale, slug, tool.seo);
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/${tool.slug}`,
    locale,
  });
}

export function toolJsonLd(slug: string, locale: Language = DEFAULT_LOCALE) {
  const tool = getTool(slug);
  const seo = translateToolSeo(locale, slug, tool.seo);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${site.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    inLanguage: locale,
    url: new URL(pathFor(locale, `/${tool.slug}`), site.url).toString(),
    description: seo.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
