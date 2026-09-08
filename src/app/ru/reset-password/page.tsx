import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Новый пароль | orzix",
    description: "Задайте новый пароль для аккаунта orzix.",
    path: "/reset-password",
    locale: "ru",
  }),
  // Sign-in pages have no business in search results.
  robots: { index: false, follow: false },
};

export { default } from "@/app/reset-password/page";
