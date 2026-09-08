import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Профиль | orzix",
    description: "Данные вашего аккаунта orzix.",
    path: "/profile",
    locale: "ru",
  }),
  robots: { index: false, follow: false },
};

export { default } from "@/app/profile/page";
