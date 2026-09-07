"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "secondary",
  size = "sm",
}: {
  variant?: "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <form action={signOut}>
      <Button type="submit" variant={variant} size={size}>
        <LogOut aria-hidden="true" />
        Log out
      </Button>
    </form>
  );
}
