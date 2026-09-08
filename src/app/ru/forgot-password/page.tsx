import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Восстановление пароля | orzix",
    description: "Отправьте себе ссылку для смены пароля.",
    path: "/forgot-password",
    locale: "ru",
  }),
  // Sign-in pages have no business in search results.
  robots: { index: false, follow: false },
};

export { default } from "@/app/forgot-password/page";
