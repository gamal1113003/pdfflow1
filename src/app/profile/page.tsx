import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Profile | PDFFlow",
    description: "Your PDFFlow account details.",
    path: "/profile",
  }),
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  return (
    <div className="container py-14 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold">Profile</h1>
        <p className="mt-3 text-muted-foreground">
          Your account details. We hold your email, your name if you gave one, and which tools you
          used — nothing from inside your documents.
        </p>
      </header>

      <div className="mt-10 max-w-xl space-y-6">
        <ProfileForm
          email={session.email}
          fullName={session.profile?.full_name ?? ""}
          plan={session.profile?.plan ?? "free"}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <SignOutButton variant="ghost" size="md" />
        </div>
      </div>
    </div>
  );
}
