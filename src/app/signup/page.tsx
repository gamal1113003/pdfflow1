import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { signUp } from "@/lib/auth/actions";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Create an account | PDFFlow",
    description: "Create a PDFFlow account for higher limits and server-side tools.",
    path: "/signup",
  }),
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="container flex justify-center py-16 sm:py-20">
      <AuthCard
        title="Create your account"
        intro="An account raises your limits and unlocks the server-side tools. We store your email and which tools you used — never your documents."
        action={signUp}
        submitLabel="Create account"
        fields={[
          { name: "full_name", label: "Your name", autoComplete: "name", required: false },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            hint: "At least 10 characters. Length matters more than symbols.",
          },
        ]}
        footer={
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      />
    </div>
  );
}
