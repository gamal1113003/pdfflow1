"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dictionaries, type Dictionary, type Language } from "@/lib/i18n/dictionaries";
import { stripLocale } from "@/lib/i18n/locale";

const STORAGE_KEY = "orzix.language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: dictionaries.en,
});

/**
 * Reads the saved choice, otherwise follows the browser's own preference.
 * Returns "en" on the server, where neither exists.
 */
function readLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "ru") return saved;
  return navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function LanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  /**
   * Set by the route. When present the language is fixed and no longer read
   * from storage, so /ru/merge-pdf is always Russian — which is what lets a
   * search engine index the two versions separately.
   */
  locale?: Language;
}) {
  // Resolved during the first render rather than in an effect. Reading it
  // afterwards meant the page painted in English and then re-rendered in
  // Russian, and because Russian runs longer the whole layout resettled —
  // which looked like the page shaking on every navigation.
  // The header and footer live in the root layout, above the /ru layout, so a
  // prop cannot reach them. Reading the locale from the pathname keeps the
  // whole page in one language — the URL is the single source of truth.
  const pathname = usePathname() || "/";
  const fromUrl = stripLocale(pathname).locale;
  const resolved = locale ?? (pathname.startsWith("/ru") ? fromUrl : null);

  const [language, setLanguageState] = useState<Language>(resolved ?? readLanguage);

  useEffect(() => {
    const target = resolved ?? readLanguage();
    if (target !== language) setLanguageState(target);
  }, [resolved, language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: dictionaries[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
