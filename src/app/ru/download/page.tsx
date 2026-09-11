import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Установить orzix — инструменты для PDF на вашем устройстве | orzix",
  description:
    "Добавьте orzix на устройство и работайте с PDF в одно нажатие. Большинство инструментов работает без интернета.",
  path: "/download",
  locale: "ru",
});

export { default } from "@/app/download/page";
