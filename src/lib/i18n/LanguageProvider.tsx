"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Dictionary, type Language } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "pdfflow.language";

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Restore the saved choice, otherwise follow the browser's own preference.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ru") {
      setLanguageState(saved);
      return;
    }
    if (navigator.language?.toLowerCase().startsWith("ru")) setLanguageState("ru");
  }, []);

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
