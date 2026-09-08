import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "orzix — простые инструменты для любого PDF",
  description: "Сжимайте, конвертируйте, объединяйте, разделяйте, редактируйте и подписывайте PDF — быстро и прямо в браузере.",
  path: "/",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/page";
