"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const COPY = {
  en: {
    title: "Install orzix",
    body: "Add it to your device and the tools keep working without a connection.",
    install: "Install",
    dismiss: "Not now",
  },
  ru: {
    title: "Установить orzix",
    body: "Добавьте на устройство — инструменты будут работать и без интернета.",
    install: "Установить",
    dismiss: "Не сейчас",
  },
};

const DISMISSED_KEY = "orzix.install-dismissed";

/**
 * Offers to install the site as an app, when the browser says that is possible.
 *
 * The browser only fires this event when the app is installable and not
 * already installed, so there is no need to detect either. A dismissal is
 * remembered: nothing is more irritating than a banner that returns.
 */
export function InstallPrompt() {
  const { language } = useLanguage();
  const t = COPY[language === "ru" ? "ru" : "en"];
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISSED_KEY)) return;

    const onPrompt = (incoming: Event) => {
      // Chrome shows its own bar unless this is prevented.
      incoming.preventDefault();
      setEvent(incoming as InstallEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setEvent(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md animate-fade-in rounded-2xl border border-border bg-card p-5 shadow-pop sm:inset-x-auto sm:right-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Download className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-display font-semibold">{t.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await event.prompt();
                await event.userChoice;
                setEvent(null);
              }}
            >
              {t.install}
            </Button>
            <Button variant="ghost" size="sm" onClick={dismiss}>
              {t.dismiss}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span className="sr-only">{t.dismiss}</span>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
