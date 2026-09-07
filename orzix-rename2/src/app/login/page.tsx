import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { signIn } from "@/lib/auth/actions";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Sign in | orzix",
    description: "Sign in to your orzix account.",
    path: "/login",
  }),
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="container flex justify-center py-16 sm:py-20">
      <AuthCard
        title="Welcome back"
        intro="Sign in to see your usage and manage your plan."
        action={signIn}
        hidden={{ next: next ?? "/dashboard" }}
        submitLabel="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "username" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <>
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
            <span className="mx-2">·</span>
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        }
      />
    </div>
  );
}
