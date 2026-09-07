export type Plan = "free" | "pro" | "business";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
};

export type UsageRow = {
  id: string;
  user_id: string;
  tool: string;
  created_at: string;
};

/**
 * Shape expected by @supabase/ssr. Each table needs Row, Insert and Update
 * spelled out as plain object types — intersections like `Partial<Profile> &
 * { id: string }` break the client's type inference and every call collapses
 * to `never`.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          plan?: Plan;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          plan?: Plan;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage: {
        Row: UsageRow;
        Insert: {
          id?: string;
          user_id: string;
          tool: string;
          created_at?: string;
        };
        // Append-only in practice: there is no update or delete policy on this
        // table, so history cannot be rewritten from the client whatever the
        // types permit.
        Update: {
          id?: string;
          user_id?: string;
          tool?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
