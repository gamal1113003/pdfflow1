"use client";

import { Check, Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useInstall } from "@/lib/pwa/install";

const COPY = {
  en: {
    title: "Application",
    lede: "Add it to your device and the tools are one tap away — on Windows, Mac, Android or iPhone.",
    cta: "Install",
    installed: "Already installed",
    installedBody: "orzix is on this device. Open it from your home screen or app list.",
    how: "How to install",
    steps: [
      "On a phone: open the browser menu and choose Add to Home screen.",
      "On Chrome or Edge: click the install icon in the address bar.",
      "On Safari: choose Share, then Add to Dock or Add to Home Screen.",
    ],
    manual: "Your browser cannot install from a button. Use the steps above instead.",
    pointsTitle: "What you get",
    points: [
      "An icon on your device, opening straight into the tools",
      "Merging, splitting, cropping, compressing, signing and the rest keep working with no connection",
      "Nothing to update — it stays current with the site",
    ],
    caveat:
      "Converting Office documents, reading scanned text and translating need a connection, because they rely on software too large to run on your device. Everything else does not.",
  },
  ru: {
    title: "Приложение",
    lede: "Добавьте на устройство — инструменты будут в одно нажатие: Windows, Mac, Android или iPhone.",
    cta: "Установить",
    installed: "Уже установлено",
    installedBody: "orzix есть на этом устройстве. Откройте его с главного экрана или из списка приложений.",
    how: "Как установить",
    steps: [
      "На телефоне: откройте меню браузера и выберите «Добавить на главный экран».",
      "В Chrome или Edge: нажмите значок установки в адресной строке.",
      "В Safari: «Поделиться», затем «Добавить в Dock» или «На экран «Домой»».",
    ],
    manual: "Ваш браузер не умеет устанавливать по кнопке. Используйте шаги выше.",
    pointsTitle: "Что вы получаете",
    points: [
      "Значок на устройстве, открывающий сразу инструменты",
      "Объединение, разделение, обрезка, сжатие, подпись и остальное работают без интернета",
      "Обновлять не нужно — версия всегда совпадает с сайтом",
    ],
    caveat:
      "Конвертация офисных документов, распознавание текста и перевод требуют подключения: они используют софт, слишком большой для вашего устройства. Всё остальное — нет.",
  },
};

export function DownloadPage() {
  const { language } = useLanguage();
  const t = COPY[language === "ru" ? "ru" : "en"];
  const { canInstall, installed, install } = useInstall();

  return (
    <div className="container py-14 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Monitor className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-6 font-display text-display-md font-semibold">{t.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.lede}</p>

        {installed ? (
          <div className="mt-8 rounded-2xl border border-success/25 bg-success-soft p-5">
            <p className="font-medium text-success">{t.installed}</p>
            <p className="mt-1 text-sm leading-relaxed text-success/85">{t.installedBody}</p>
          </div>
        ) : canInstall ? (
          /* The browser has offered installation, so one press does it. Its own
             confirmation still appears — a site cannot install itself. */
          <Button size="lg" className="mt-8" onClick={() => void install()}>
            <Download aria-hidden="true" />
            {t.cta}
          </Button>
        ) : (
          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold">{t.how}</h2>
            <ul className="mt-3 space-y-2">
              {t.steps.map((step) => (
                <li key={step} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">{t.manual}</p>
          </div>
        )}

        <h2 className="mt-12 font-display text-display-sm font-semibold">{t.pointsTitle}</h2>
        <ul className="mt-5 space-y-3">
          {t.points.map((point) => (
            <li key={point} className="flex gap-3 leading-relaxed text-muted-foreground">
              <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {t.caveat}
        </p>
      </div>
    </div>
  );
}
