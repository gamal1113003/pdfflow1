"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Records that a tool was run. Stores the tool slug and a timestamp — never
 * the file, its name, its size or its contents.
 *
 * Signed-out visitors are not tracked at all: there is no row to attach the
 * event to, and RLS would reject it anyway.
 */
export async function recordUsage(tool: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("usage").insert({ user_id: user.id, tool });
  } catch {
    // Usage tracking must never break a tool the person is trying to use.
  }
}
