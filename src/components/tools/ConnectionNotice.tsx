"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const COPY = {
  en: {
    needsInternet: "This tool needs an internet connection",
    needsInternetBody:
      "Converting Office documents and reading scanned text is done on a server, because the software involved is far too large to run here. The file is sent, processed and deleted immediately.",
    offline: "You are offline",
    offlineBody:
      "This tool cannot run without a connection. Everything else — merging, splitting, cropping, rotating, compressing, watermarking, signing and image conversion — works offline.",
    local: "Runs on your device",
    localBody: "No connection needed. Your file is not sent anywhere.",
  },
  ru: {
    needsInternet: "Для этого инструмента нужен интернет",
    needsInternetBody:
      "Преобразование офисных документов и распознавание текста выполняются на сервере: нужные программы слишком велики, чтобы работать здесь. Файл отправляется, обрабатывается и сразу удаляется.",
    offline: "Нет подключения к интернету",
    offlineBody:
      "Этот инструмент не работает без связи. Всё остальное — объединение, разделение, обрезка, поворот, сжатие, водяные знаки, подпись и работа с изображениями — работает офлайн.",
    local: "Работает на вашем устройстве",
    localBody: "Подключение не требуется. Файл никуда не отправляется.",
  },
};

/**
 * Tells the person, before they choose a file, whether this tool will need a
 * connection. Worth saying plainly: in the desktop app most tools work with
 * the network switched off, and it is not obvious which ones do not.
 */
export function ConnectionNotice({ runsInBrowser }: { runsInBrowser: boolean }) {
  const { language } = useLanguage();
  const t = COPY[language === "ru" ? "ru" : "en"];

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (runsInBrowser) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Wifi className="size-4 text-success" aria-hidden="true" />
        {t.local} · {t.localBody}
      </p>
    );
  }

  const problem = !online;

  return (
    <div
      className={
        problem
          ? "flex gap-3 rounded-2xl border border-destructive/25 bg-destructive-soft p-5"
          : "flex gap-3 rounded-2xl border border-border bg-muted/60 p-5"
      }
    >
      {problem ? (
        <WifiOff className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <Wifi className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <div className="space-y-1">
        <p className={problem ? "font-medium text-destructive" : "font-medium text-foreground"}>
          {problem ? t.offline : t.needsInternet}
        </p>
        <p
          className={
            problem
              ? "max-w-[62ch] text-sm leading-relaxed text-destructive/85"
              : "max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
          }
        >
          {problem ? t.offlineBody : t.needsInternetBody}
        </p>
      </div>
    </div>
  );
}
