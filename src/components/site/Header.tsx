"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
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
import { popularTools, tools } from "@/lib/tools";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { pathFor } from "@/lib/i18n/locale";
import { translateTool } from "@/lib/i18n/toolStrings";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "compress" as const, href: "/compress-pdf" },
  { key: "convert" as const, href: "/tools?category=convert-from-pdf" },
  { key: "organize" as const, href: "/tools?category=organize" },
  { key: "edit" as const, href: "/tools?category=edit" },
];

export function Header() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

            {NAV.map((item) => (
              <Link
                key={item.key}
                href={pathFor(language, item.href)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === item.href && "text-foreground",
                )}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href={pathFor(language, "/login")}>Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={pathFor(language, "/signup")}>{t.nav.getStarted}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild size="sm" variant="secondary">
            <Link href={pathFor(language, "/login")}>Log in</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-foreground"
          >
            <span className="sr-only">{open ? t.nav.closeMenu : t.nav.openMenu}</span>
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background lg:hidden"
        >
          <div className="container space-y-6 py-6">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="secondary" size="lg">
                <Link href={pathFor(language, "/login")}>Log in</Link>
              </Button>
              <Button asChild size="lg">
                <Link href={pathFor(language, "/signup")}>{t.nav.getStarted}</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-border"
              >
                <span className="sr-only">{t.nav.closeMenu}</span>
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="grid gap-2">
              {popularTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={pathFor(language, `/${tool.slug}`)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                    <ToolIcon name={tool.icon} className="size-4" />
                  </span>
                  <span className="text-[0.95rem] font-medium">{translateTool(language, tool.slug, tool).name}</span>
                </Link>
              ))}
            </div>

            <nav aria-label="Sections" className="grid gap-1 border-t border-border pt-6">
              <Link href={pathFor(language, "/tools")} className="py-2.5 text-[1.05rem] font-medium">
                {t.nav.browseAll}
              </Link>
              {NAV.map((item) => (
                <Link key={item.key} href={pathFor(language, item.href)} className="py-2.5 text-[1.05rem] font-medium">
                  {t.nav[item.key]}
                </Link>
              ))}
            </nav>

          </div>
        </div>
      )}
    </header>
  );
}
