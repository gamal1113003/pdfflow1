import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Все инструменты для PDF онлайн | orzix",
  description: "Полный набор инструментов для PDF: сжатие, объединение, разделение, конвертация, подпись и защита.",
  path: "/tools",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/tools/page";
