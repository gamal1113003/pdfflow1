# Supabase setup

1. Create a project at supabase.com and copy the **Project URL** and the
   **anon public** key from Settings → API.

2. Put them in `.env.local` at the root of the project:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Never add the **service_role** key to a `NEXT_PUBLIC_` variable. It ignores
   every Row Level Security policy and would be readable by anyone visiting the
   site.

3. Open the SQL Editor in Supabase, paste the whole of
   `migrations/0001_init.sql`, and run it.

4. Under Authentication → URL Configuration, set the Site URL to
   `http://localhost:3000` for development, and add
   `http://localhost:3000/auth/callback` as a redirect URL. Add your production
   domain the same way before deploying.

5. Restart `npm run dev`.

## Checking the policies actually work

In the SQL editor, this should return nothing at all, because the editor runs
without an authenticated user and every policy is scoped to `auth.uid()`:

```sql
select * from public.profiles;
```

If it returns rows, RLS is not enabled — re-run the migration.
