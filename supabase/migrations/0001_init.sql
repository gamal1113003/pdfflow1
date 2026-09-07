-- PDFFlow schema.
--
-- Two tables only: who the account belongs to, and which tools were used.
-- No document contents, no file names, no page counts, no previews — there is
-- deliberately nowhere in this schema to put a PDF.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Account details. Contains no document data of any kind.';

-- ---------------------------------------------------------------------------
-- usage
-- ---------------------------------------------------------------------------
create table if not exists public.usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tool        text not null,
  created_at  timestamptz not null default now()
);

comment on table public.usage is
  'One row per tool run: which tool, when, by whom. Never the file itself.';

create index if not exists usage_user_id_created_at_idx
  on public.usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.usage    enable row level security;

-- profiles: a user may read and update only their own row. There is no insert
-- policy and no delete policy: rows are created by the trigger below and
-- removed by the cascade when the auth user is deleted.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- usage: a user may read and add only their own rows. No update or delete
-- policy, so history cannot be rewritten from the client.
drop policy if exists "usage_select_own" on public.usage;
create policy "usage_select_own"
  on public.usage for select
  using (auth.uid() = user_id);

drop policy if exists "usage_insert_own" on public.usage;
create policy "usage_insert_own"
  on public.usage for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep the plan column honest: a user must not be able to promote themselves.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_plan_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan then
    raise exception 'plan can only be changed by billing';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_plan on public.profiles;
create trigger profiles_guard_plan
  before update on public.profiles
  for each row execute function public.prevent_plan_self_change();

-- ---------------------------------------------------------------------------
-- Create a profile row automatically when someone signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Usage counter for the dashboard, without exposing other users' rows.
-- ---------------------------------------------------------------------------
create or replace function public.usage_this_month()
returns integer
language sql
security invoker
stable
as $$
  select count(*)::int
  from public.usage
  where user_id = auth.uid()
    and created_at >= date_trunc('month', now());
$$;
