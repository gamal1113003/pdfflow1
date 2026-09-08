import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Вход | orzix",
    description: "Войдите в свой аккаунт orzix.",
    path: "/login",
    locale: "ru",
  }),
  // Sign-in pages have no business in search results.
  robots: { index: false, follow: false },
};

export { default } from "@/app/login/page";
