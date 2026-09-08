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

export function LanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: Language;
}) {
  const pathname = usePathname() || "/";

  /**
   * The URL decides the language, and nothing else does during render.
   *
   * An earlier version read localStorage here. That produced a different
   * result on the server (always English) than in the browser (whatever was
   * saved), and React treats such a mismatch as a hydration failure — which
   * can leave the page rendered but inert, with buttons that do nothing.
   *
   * Since every page now exists at both /page and /ru/page, the address is
   * enough on its own.
   */
  const language: Language = locale ?? stripLocale(pathname).locale;

  const [, force] = useState(0);

  useEffect(() => {
    document.documentElement.lang = language;
    // Remembered only so a returning visitor can be sent to their language
    // from the home page; never read during render.
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    force((value) => value + 1);
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
