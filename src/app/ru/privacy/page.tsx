import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Конфиденциальность | orzix",
  description: "Как orzix обращается с вашими файлами: что выполняется в браузере, что на сервере и что мы храним.",
  path: "/privacy",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/privacy/page";
