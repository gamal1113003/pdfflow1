import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Контакты | orzix",
  description: "Вопросы по инструментам или аккаунту — напишите команде orzix.",
  path: "/contact",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/contact/page";
