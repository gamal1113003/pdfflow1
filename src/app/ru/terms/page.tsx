import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Условия использования | orzix",
  description: "Условия использования инструментов orzix для работы с PDF.",
  path: "/terms",
  locale: "ru",
});

// The same page component; the layout above pins the language to Russian.
export { default } from "@/app/terms/page";
