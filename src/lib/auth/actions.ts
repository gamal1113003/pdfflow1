"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { site } from "@/lib/site";

export type ActionState = { error?: string; message?: string };

const NOT_CONFIGURED =
  "Accounts are not switched on for this build. Every browser-based PDF tool still works without one.";

function readPassword(formData: FormData, field = "password"): string {
  return String(formData.get(field) ?? "");
}

/** Length beats symbol soup. */
function checkPassword(password: string): string | null {
  if (password.length < 10) return "Use a password of at least 10 characters.";
  if (password.length > 200) return "That password is too long.";
  if (/^\d+$/.test(password)) return "Use more than just numbers.";
  return null;
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const email = String(formData.get("email") ?? "").trim();
  const password = readPassword(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email.includes("@")) return { error: "Enter a valid email address." };
  const passwordProblem = checkPassword(password);
  if (passwordProblem) return { error: passwordProblem };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: new URL("/auth/callback", site.url).toString(),
    },
  });

  if (error) return { error: error.message };

  return {
    message:
      "Check your email to confirm the address. The link signs you in and finishes setting up your account.",
  };
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const email = String(formData.get("email") ?? "").trim();
  const password = readPassword(formData);
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately vague: naming the wrong field tells an attacker which
    // addresses have accounts.
    return { error: "That email and password combination is not correct." };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/auth/callback?next=/reset-password", site.url).toString(),
  });

  // The same reply either way, so this page cannot be used to discover which
  // addresses are registered.
  return {
    message: "If that address has an account, a reset link is on its way.",
  };
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const password = readPassword(formData);
  const confirm = readPassword(formData, "confirm_password");

  const problem = checkPassword(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { message: "Profile saved." };
}
