"use client";

import Link from "next/link";
import { LogoMark } from "@/components/site/Logo";
import { tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { translateTool } from "@/lib/i18n/toolStrings";

const TOOL_LINKS = [
  "compress-pdf",
  "merge-pdf",
  "split-pdf",
  "pdf-to-word",
  "pdf-to-jpg",
  "sign-pdf",
];

export function Footer() {
  const { language, t } = useLanguage();

  const columns = [
    {
      heading: t.footer.tools,
      links: TOOL_LINKS.map((slug) => {
        const tool = tools.find((entry) => entry.slug === slug);
        return {
          label: tool ? translateTool(language, slug, tool).name : slug,
          href: `/${slug}`,
        };
      }),
    },
    {
      heading: t.footer.company,
      links: [
        { label: t.footer.about, href: "/about" },
        { label: t.footer.contact, href: "/contact" },
      ],
    },
    {
      heading: t.footer.legal,
      links: [
        { label: t.footer.privacy, href: "/privacy" },
        { label: t.footer.terms, href: "/terms" },
        { label: t.footer.security, href: "/privacy#security" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-display text-lg font-semibold tracking-[-0.02em]">orzix</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.footer.tagline}</p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Most tools run entirely inside your browser tab, so your documents stay on your device.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="font-display text-sm font-semibold text-foreground">{column.heading}</h2>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.rights}</p>
          <p>{t.footer.strap}</p>
        </div>
      </div>
    </footer>
  );
}
