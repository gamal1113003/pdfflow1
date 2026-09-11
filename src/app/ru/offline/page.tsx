import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Нет подключения | orzix",
    description: "Нет подключения к интернету.",
    path: "/offline",
    locale: "ru",
  }),
  robots: { index: false, follow: false },
};

export { default } from "@/app/offline/page";
