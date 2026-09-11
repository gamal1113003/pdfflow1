"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { popularTools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { pathFor } from "@/lib/i18n/locale";
import { translateTool } from "@/lib/i18n/toolStrings";
import { cn } from "@/lib/utils";

export function Header() {
  const { language, t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-7">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {/* modal={false} stops Radix locking page scroll while the menu is
                open. The lock removes the scrollbar, which shifts the whole
                page sideways by its width and snaps back on close. */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground">
                {t.nav.tools}
                <ChevronDown className="size-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[22rem]">
                <DropdownMenuLabel>{t.nav.mostUsed}</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-0.5">
                  {popularTools.slice(0, 8).map((tool) => (
                    <DropdownMenuItem key={tool.slug} asChild>
                      <Link href={pathFor(language, `/${tool.slug}`)}>
                        <ToolIcon name={tool.icon} className="size-4 text-primary" />
                        <span className="truncate">{translateTool(language, tool.slug, tool).name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={pathFor(language, "/tools")} className="font-medium text-primary">
                    {t.nav.browseAll}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={pathFor(language, "/download")}
            className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t.footer.download}
          </Link>
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href={pathFor(language, "/login")}>Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={pathFor(language, "/signup")}>{t.nav.getStarted}</Link>
          </Button>
        </div>

        {/* No slide-out panel on small screens: the controls that matter fit
            in the bar itself, and a menu that has to open is one more thing to
            go wrong. Everything else is reachable from the tools page. */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={pathFor(language, "/tools")}>{t.nav.tools}</Link>
          </Button>
        </div>
      </div>

    </header>
  );
}
