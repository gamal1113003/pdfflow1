import type { Language } from "@/lib/i18n/dictionaries";

export const LOCALES: Language[] = ["en", "ru"];
export const DEFAULT_LOCALE: Language = "en";

/**
 * English lives at the root (/merge-pdf) and Russian under a prefix
 * (/ru/merge-pdf). Keeping English unprefixed means the URLs that already
 * exist do not change, so nothing that has been indexed is lost.
 */
export function pathFor(locale: Language, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === "/" ? "" : clean}`;
}

/** Strips a locale prefix, so /ru/merge-pdf becomes /merge-pdf. */
export function stripLocale(pathname: string): { locale: Language; path: string } {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** The same page in the other language. */
export function switchLocale(pathname: string, to: Language): string {
  const { path } = stripLocale(pathname);
  return pathFor(to, path);
}
