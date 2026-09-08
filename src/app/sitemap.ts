import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { tools } from "@/lib/tools";
import { LOCALES, pathFor } from "@/lib/i18n/locale";

/**
 * Lists every page in both languages, and points each entry at its
 * translation. Search engines need both halves: the URL itself, and the
 * statement that the English and Russian versions are the same page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    { path: "/", priority: 1 },
    { path: "/tools", priority: 0.8 },
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    ...tools.map((tool) => ({
      path: `/${tool.slug}`,
      priority: tool.popular ? 0.9 : 0.6,
    })),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority } of paths) {
    const languages: Record<string, string> = {};
    for (const locale of LOCALES) {
      languages[locale] = new URL(pathFor(locale, path), site.url).toString();
    }

    for (const locale of LOCALES) {
      entries.push({
        url: new URL(pathFor(locale, path), site.url).toString(),
        lastModified: now,
        changeFrequency: "monthly",
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
