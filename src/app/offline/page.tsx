import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Offline | orzix",
    description: "You are offline.",
    path: "/offline",
  }),
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container py-20 text-center sm:py-28">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-display-sm font-semibold">You are offline</h1>
      <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
        This page has not been opened before, so there is no copy on your device. Pages you have
        already visited still work — as do the tools on them, since they never needed a connection
        in the first place.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/tools">Go to the tools</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
