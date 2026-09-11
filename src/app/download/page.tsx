import type { Metadata } from "next";
import { DownloadPage } from "@/components/site/DownloadPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Download orzix for Windows — Offline PDF Tools | orzix",
  description:
    "Install orzix on your computer and work with PDFs without a connection. Or add the web version to your device in one tap.",
  path: "/download",
});

export default function Page() {
  return <DownloadPage />;
}
