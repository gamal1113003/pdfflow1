import Link from "next/link";
import { LogoMark } from "@/components/site/Logo";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Tools",
    links: [
      { label: "Compress PDF", href: "/compress-pdf" },
      { label: "Merge PDF", href: "/merge-pdf" },
      { label: "Split PDF", href: "/split-pdf" },
      { label: "PDF to Word", href: "/pdf-to-word" },
      { label: "PDF to JPG", href: "/pdf-to-jpg" },
      { label: "Sign PDF", href: "/sign-pdf" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/privacy#security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-display text-lg font-semibold tracking-[-0.02em]">PDFFlow</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{site.tagline}</p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Most tools run entirely inside your browser tab, so your documents stay on your device.
          </p>
        </div>

        {COLUMNS.map((column) => (
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
          <p>© 2026 PDFFlow. All rights reserved.</p>
          <p>Built for people who just need the file fixed.</p>
        </div>
      </div>
    </footer>
  );
}
