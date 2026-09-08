import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

/**
 * Everything under /ru is Russian regardless of what the visitor chose
 * before. That fixed relationship between URL and language is what lets a
 * search engine index the two versions separately.
 */
export default function RussianLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider locale="ru">{children}</LanguageProvider>;
}
