import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "О сервисе orzix",
  description: "orzix — набор инструментов для PDF, который работает прямо в браузере, поэтому документы остаются на вашем устройстве.",
  path: "/about",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/about/page";
