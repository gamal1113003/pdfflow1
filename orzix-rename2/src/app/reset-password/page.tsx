import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { updatePassword } from "@/lib/auth/actions";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Choose a new password | orzix",
    description: "Set a new password for your orzix account.",
    path: "/reset-password",
  }),
  robots: { index: false, follow: false },
};

/**
 * Reached from the emailed link, which the /auth/callback route exchanges for
 * a session before redirecting here.
 */
export default function ResetPasswordPage() {
  return (
    <div className="container flex justify-center py-16 sm:py-20">
      <AuthCard
        title="Choose a new password"
        intro="You followed a reset link, so you can set a new password now."
        action={updatePassword}
        submitLabel="Save new password"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            hint: "At least 10 characters.",
          },
          {
            name: "confirm_password",
            label: "Confirm new password",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
    </div>
  );
}
