"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export function createClient() {
  // See the note in server.ts on why the Database generic is not used.
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
