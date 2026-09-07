import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { requestPasswordReset } from "@/lib/auth/actions";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Reset your password | orzix",
    description: "Send yourself a password reset link.",
    path: "/forgot-password",
  }),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container flex justify-center py-16 sm:py-20">
      <AuthCard
        title="Reset your password"
        intro="Enter your email and we will send a link that lets you set a new password."
        action={requestPasswordReset}
        submitLabel="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        footer={
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        }
      />
    </div>
  );
}
