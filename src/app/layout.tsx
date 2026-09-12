import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { PendingFileProvider } from "@/components/pdf/PendingFileProvider";
import { ServiceWorker } from "@/components/site/ServiceWorker";
import { InstallPrompt } from "@/components/site/InstallPrompt";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * Both families include Cyrillic.
 *
 * Previously only the Latin subset was requested, which meant every Russian
 * page fell back to whatever the operating system supplied — while still
 * downloading two Latin fonts to render text they had no glyphs for.
 *
 * Plus Jakarta Sans was the display face before. It has no Cyrillic at all, so
 * it has been replaced by Manrope, which is close in character and does.
 */
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const display = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  // Headings appear below the fold on some pages, so preloading every weight
  // downloads files the browser may not use — which is what Chrome warns
  // about. Loaded on demand instead.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s`,
  },
  description: site.description,
  applicationName: site.name,
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: site.name },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: {
    canonical: site.url,
    languages: {
      en: site.url,
      ru: `${site.url}/ru`,
      "x-default": site.url,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1016" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <PendingFileProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <InstallPrompt />
            <ServiceWorker />
            </PendingFileProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
