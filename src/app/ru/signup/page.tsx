import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Регистрация | orzix",
    description: "Создайте аккаунт orzix, чтобы увеличить лимиты и открыть серверные инструменты.",
    path: "/signup",
    locale: "ru",
  }),
  // Sign-in pages have no business in search results.
  robots: { index: false, follow: false },
};

export { default } from "@/app/signup/page";
