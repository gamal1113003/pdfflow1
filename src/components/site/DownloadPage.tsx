"use client";

import { AlertTriangle, Check, Download, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useInstall } from "@/lib/pwa/install";

/**
 * Where the Windows installer lives. Left unset the page says the download is
 * not ready rather than offering a broken link — a download page with a dead
 * button is worse than one that admits it is coming.
 */
const INSTALLER_URL = process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ?? "";
const INSTALLER_SIZE = process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_SIZE ?? "";

const COPY = {
  en: {
    title: "Use orzix on your device",
    lede: "Two ways, and for most people the first is the better one.",
    webTitle: "Add the web version",
    webBody:
      "Install orzix from your browser. It works on Windows, Mac, Android and iPhone, takes a second, and every tool is available. The browser-based tools keep working with no connection once it is installed.",
    webHow: "How to install",
    webSteps: [
      "On a phone: open the browser menu and choose Add to Home screen.",
      "On Chrome or Edge: click the install icon in the address bar.",
      "On Safari: choose Share, then Add to Dock or Add to Home Screen.",
    ],
    webCta: "Install",
    webInstalled: "Already installed",
    webInstalledBody: "orzix is on this device. Open it from your home screen or app list.",
    webManual: "Your browser cannot install from a button. Use the steps above instead.",
    desktopTitle: "Windows application",
    desktopBody:
      "A separate program that carries everything it needs inside it — including the software for Word conversion and text recognition. It works with the network switched off entirely.",
    desktopIncludes: "Every tool works offline, including:",
    desktopList: [
      "Word, Excel and PowerPoint conversion, both directions",
      "Reading text from scans",
      "Adding and removing passwords",
    ],
    desktopCta: "Download for Windows",
    notReady: "Not ready yet",
    notReadyBody:
      "The Windows application is not published yet. The web version above has the same tools and installs in a second.",
    warningTitle: "Windows will warn you about this file",
    warningBody:
      "The installer is not signed with a certificate, so Windows shows “Windows protected your PC”. Choose More info, then Run anyway. A certificate costs several hundred pounds a year and is not something this project has yet — that is the honest reason, not a technical one.",
  },
  ru: {
    title: "orzix на вашем устройстве",
    lede: "Два способа, и для большинства первый удобнее.",
    webTitle: "Установить веб-версию",
    webBody:
      "Установите orzix прямо из браузера. Работает на Windows, Mac, Android и iPhone, занимает секунду, и доступны все инструменты. Браузерные инструменты продолжают работать и без интернета.",
    webHow: "Как установить",
    webSteps: [
      "На телефоне: откройте меню браузера и выберите «Добавить на главный экран».",
      "В Chrome или Edge: нажмите значок установки в адресной строке.",
      "В Safari: «Поделиться», затем «Добавить в Dock» или «На экран «Домой»».",
    ],
    webCta: "Установить",
    webInstalled: "Уже установлено",
    webInstalledBody: "orzix есть на этом устройстве. Откройте его с главного экрана или из списка приложений.",
    webManual: "Ваш браузер не умеет устанавливать по кнопке. Используйте шаги выше.",
    desktopTitle: "Программа для Windows",
    desktopBody:
      "Отдельная программа, которая несёт всё необходимое внутри себя — включая софт для конвертации Word и распознавания текста. Работает при полностью отключённой сети.",
    desktopIncludes: "Все инструменты работают офлайн, в том числе:",
    desktopList: [
      "Конвертация Word, Excel и PowerPoint в обе стороны",
      "Распознавание текста на сканах",
      "Установка и снятие пароля",
    ],
    desktopCta: "Скачать для Windows",
    notReady: "Пока не готово",
    notReadyBody:
      "Программа для Windows ещё не опубликована. Веб-версия выше содержит те же инструменты и устанавливается за секунду.",
    warningTitle: "Windows предупредит об этом файле",
    warningBody:
      "Установщик не подписан сертификатом, поэтому Windows покажет «Система Windows защитила ваш компьютер». Нажмите «Подробнее», затем «Выполнить в любом случае». Сертификат стоит несколько сотен в год, и у проекта его пока нет — это честная причина, а не техническая.",
  },
};

export function DownloadPage() {
  const { language } = useLanguage();
  const t = COPY[language === "ru" ? "ru" : "en"];
  const { canInstall, installed, install } = useInstall();

  return (
    <div className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">{t.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.lede}</p>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* The web version, listed first because it suits more people. */}
        <div className="rounded-2xl border border-primary/40 bg-card p-7 shadow-card">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <Globe className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{t.webTitle}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t.webBody}</p>

          {installed ? (
            <div className="mt-6 rounded-xl border border-success/25 bg-success-soft p-4">
              <p className="text-sm font-medium text-success">{t.webInstalled}</p>
              <p className="mt-1 text-sm leading-relaxed text-success/85">
                {t.webInstalledBody}
              </p>
            </div>
          ) : canInstall ? (
            /* The browser handed us an install offer, so one press does it.
               Its own confirmation dialog still appears — that is the
               browser's, and a site cannot install itself silently. */
            <Button size="lg" className="mt-7" onClick={() => void install()}>
              <Download aria-hidden="true" />
              {t.webCta}
            </Button>
          ) : (
            <>
              <h3 className="mt-6 font-display text-sm font-semibold">{t.webHow}</h3>
              <ul className="mt-3 space-y-2">
                {t.webSteps.map((step) => (
                  <li key={step} className="flex gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">{t.webManual}</p>
            </>
          )}
        </div>

        {/* The Windows application. */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-subtle">
          <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Monitor className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">
            {t.desktopTitle}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t.desktopBody}</p>

          <h3 className="mt-6 font-display text-sm font-semibold">{t.desktopIncludes}</h3>
          <ul className="mt-3 space-y-2">
            {t.desktopList.map((entry) => (
              <li key={entry} className="flex gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                {entry}
              </li>
            ))}
          </ul>

          {INSTALLER_URL ? (
            <>
              <Button asChild size="lg" variant="secondary" className="mt-7">
                <a href={INSTALLER_URL} download>
                  {t.desktopCta}
                  {INSTALLER_SIZE && (
                    <span className="font-normal text-muted-foreground">· {INSTALLER_SIZE}</span>
                  )}
                </a>
              </Button>

              <div className="mt-6 flex gap-3 rounded-xl border border-border bg-muted/60 p-4">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{t.warningTitle}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t.warningBody}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-7 rounded-xl border border-border bg-muted/60 p-4">
              <p className="text-sm font-medium">{t.notReady}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t.notReadyBody}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
