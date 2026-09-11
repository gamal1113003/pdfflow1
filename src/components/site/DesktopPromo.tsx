"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { pathFor, stripLocale } from "@/lib/i18n/locale";

const COPY = {
  en: {
    title: "orzix for Windows",
    body: "Every tool, working offline.",
    cta: "Get it",
    dismiss: "Hide",
  },
  ru: {
    title: "orzix для Windows",
    body: "Все инструменты, работают офлайн.",
    cta: "Скачать",
    dismiss: "Скрыть",
  },
};

const DISMISSED_KEY = "orzix.desktop-promo-dismissed";

/**
 * A standing invitation to the desktop version, on every page.
 *
 * Deliberately not shown on phones: the download is a Windows program, and
 * offering it to someone on a phone is an advert for something they cannot
 * use. Nor on the download page itself, where it would be pointing at the
 * page they are already reading.
 *
 * Dismissal is remembered. A promo that returns after being closed is worse
 * than no promo at all.
 */
export function DesktopPromo() {
  const pathname = usePathname() || "/";
  const { language } = useLanguage();
  const t = COPY[language === "ru" ? "ru" : "en"];

  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(Boolean(window.localStorage.getItem(DISMISSED_KEY)));
  }, []);

  const { path } = stripLocale(pathname);
  if (hidden || path === "/download") return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-30 hidden sm:block">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 pr-2 shadow-lifted backdrop-blur">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Monitor className="size-5" aria-hidden="true" />
        </span>

        <div className="pr-1">
          <p className="text-sm font-semibold leading-tight">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.body}</p>
        </div>

        <Link
          href={pathFor(language, "/download")}
          className="rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.cta}
        </Link>

        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISSED_KEY, "1");
            setHidden(true);
          }}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="sr-only">{t.dismiss}</span>
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
