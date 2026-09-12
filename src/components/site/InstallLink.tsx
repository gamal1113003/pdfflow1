"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { pathFor } from "@/lib/i18n/locale";
import { useInstall } from "@/lib/pwa/install";
import { cn } from "@/lib/utils";

/**
 * The Install link, shown in a browser and hidden once the app is installed.
 *
 * Inside the installed app it would be the one menu item that cannot do
 * anything. `installed` starts false and is set in an effect, so the link is
 * in the server-rendered HTML and removes itself a moment later in the app —
 * that way round means nothing flickers into view on the website, which is
 * nearly every visit.
 */
export function InstallLink({ className }: { className?: string }) {
  const { language, t } = useLanguage();
  const { installed } = useInstall();

  if (installed) return null;
  return (
    <Link
      href={pathFor(language, "/download")}
      className={cn(
        "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {t.footer.download}
    </Link>
  );
}
