import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Скачать orzix для Windows — офлайн-инструменты для PDF | orzix",
  description:
    "Установите orzix на компьютер и работайте с PDF без интернета. Или добавьте веб-версию на устройство одним нажатием.",
  path: "/download",
  locale: "ru",
});

export { default } from "@/app/download/page";
