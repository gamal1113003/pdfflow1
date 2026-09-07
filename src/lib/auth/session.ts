import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile, UsageRow } from "@/lib/supabase/types";

export type SessionData = {
  email: string;
  profile: Profile | null;
};

/** Returns the signed-in user's account, or null. Safe to call anywhere. */
export async function getSession(): Promise<SessionData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { email: user.email ?? "", profile: profile ?? null };
}

export type UsageSummary = {
  total: number;
  thisMonth: number;
  recent: UsageRow[];
  byTool: { tool: string; count: number }[];
};

export async function getUsage(): Promise<UsageSummary> {
  const empty: UsageSummary = { total: 0, thisMonth: 0, recent: [], byTool: [] };
  if (!isSupabaseConfigured()) return empty;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  // RLS already restricts these rows to the current user; the filter is here
  // so the intent is obvious when reading the code.
  const { data } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = data ?? [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.tool, (counts.get(row.tool) ?? 0) + 1);

  return {
    total: rows.length,
    thisMonth: rows.filter((row) => new Date(row.created_at) >= startOfMonth).length,
    recent: rows.slice(0, 10),
    byTool: [...counts.entries()]
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}
