import type { Metadata } from "next";
import { DownloadPage } from "@/components/site/DownloadPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Install orzix — PDF Tools on Your Device | orzix",
  description:
    "Add orzix to your device and work with PDFs in one tap. Most tools keep working with no connection.",
  path: "/download",
});

export default function Page() {
  return <DownloadPage />;
}
