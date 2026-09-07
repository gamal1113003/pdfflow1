import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { tools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["/", "/tools", "/about", "/contact", "/privacy", "/terms"];

  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, site.url).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...tools.map((tool) => ({
      url: new URL(`/${tool.slug}`, site.url).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: tool.popular ? 0.9 : 0.6,
    })),
  ];
}
