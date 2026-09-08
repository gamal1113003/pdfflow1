import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Личный кабинет | orzix",
    description: "Ваш аккаунт, план и статистика использования orzix.",
    path: "/dashboard",
    locale: "ru",
  }),
  robots: { index: false, follow: false },
};

export { default } from "@/app/dashboard/page";
