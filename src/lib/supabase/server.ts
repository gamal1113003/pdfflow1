import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** See the note in middleware.ts on why this is written out by hand. */
type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * The Database generic is deliberately not passed to the client.
 *
 * Supabase derives every argument and return type from it, and that inference
 * has broken across versions — collapsing to `never` so that valid reads and
 * writes fail to compile. Rather than cast at each call site, the client is
 * left untyped and the shapes are stated where they are used, in
 * lib/auth/session.ts and the actions.
 *
 * Nothing is lost that was protecting anything: the real constraints are the
 * row level security policies in supabase/migrations/0001_init.sql, which the
 * database enforces whatever TypeScript thinks.
 */
/** Server-side client. Sessions live in httpOnly cookies, never in localStorage. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session instead.
        }
      },
    },
  });
}
