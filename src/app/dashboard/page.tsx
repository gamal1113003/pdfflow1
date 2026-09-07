import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Settings } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSession, getUsage } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { toolBySlug } from "@/lib/tools";
import { plans } from "@/lib/pricing";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Dashboard | PDFFlow",
    description: "Your PDFFlow account, plan and usage.",
    path: "/dashboard",
  }),
  robots: { index: false, follow: false },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const usage = await getUsage();
  const planId = session.profile?.plan ?? "free";
  const plan = plans.find((entry) => entry.id === planId) ?? plans[0];
  const name = session.profile?.full_name?.trim() || session.email.split("@")[0];

  return (
    <div className="container py-14 sm:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold">Hello, {name}</h1>
          <p className="mt-2 text-muted-foreground">{session.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/profile">
              <Settings aria-hidden="true" />
              Profile
            </Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">Your plan</h2>
            <Badge variant={planId === "free" ? "neutral" : "primary"}>{plan.name}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>
          {planId === "free" && (
            <Button asChild size="sm" className="mt-5">
              <Link href="/pricing">
                Upgrade
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold tracking-tight">This month</h2>
          <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
            {usage.thisMonth}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {usage.thisMonth === 1 ? "tool opened" : "tools opened"} · {usage.total} all time
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold tracking-tight">Most used</h2>
          {usage.byTool.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {usage.byTool.map((entry) => (
                <li key={entry.tool} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground">
                    {toolBySlug.get(entry.tool)?.name ?? entry.tool}
                  </span>
                  <span className="tabular-nums font-medium">{entry.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>
          )}
        </div>
      </div>

      <section className="mt-10" aria-labelledby="recent">
        <h2 id="recent" className="font-display text-display-sm font-semibold">
          Recent activity
        </h2>
        <p className="mt-2 max-w-[62ch] text-muted-foreground">
          Which tools you opened and when. Your documents are not here, because they were never
          uploaded to us.
        </p>

        {usage.recent.length > 0 ? (
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {usage.recent.map((row) => {
              const tool = toolBySlug.get(row.tool);
              return (
                <li key={row.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    {tool ? (
                      <Link
                        href={`/${tool.slug}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {tool.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{row.tool}</span>
                    )}
                  </div>
                  <time
                    dateTime={row.created_at}
                    className="shrink-0 text-sm tabular-nums text-muted-foreground"
                  >
                    {formatDate(row.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
            <p className="font-display text-lg font-medium">No activity yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Run a tool and it will show up here.
            </p>
            <Button asChild size="sm" className="mt-5">
              <Link href="/tools">Browse tools</Link>
            </Button>
          </div>
        )}
      </section>

      <p className="mt-10 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        Your PDFs are processed temporarily and are not permanently stored. Most tools never send
        the file anywhere at all — they run inside this browser tab.
      </p>
    </div>
  );
}
