-- Sakran — Sprint 1 schema
-- Run this in Supabase SQL Editor.
-- Safe to re-run: every CREATE uses IF NOT EXISTS / OR REPLACE where possible.

-- ============================================================
-- parent_profiles: one row per auth.users row
-- ============================================================
create table if not exists public.parent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age_attested_at timestamptz,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- kids: belongs to a parent_profile
-- ============================================================
create table if not exists public.kids (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  age smallint not null check (age between 5 and 10),
  interests text[] not null default '{}',
  avatar text,
  created_at timestamptz not null default now()
);

create index if not exists kids_parent_id_idx on public.kids(parent_id);

-- ============================================================
-- Auto-create a parent_profiles shell whenever a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parent_profiles (id, full_name, age_attested_at, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when (new.raw_user_meta_data->>'age_attested')::boolean then now() end,
    case when (new.raw_user_meta_data->>'terms_accepted')::boolean then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security — a parent can only see their own data
-- ============================================================
alter table public.parent_profiles enable row level security;
alter table public.kids enable row level security;

drop policy if exists "parent_profiles_self_select" on public.parent_profiles;
create policy "parent_profiles_self_select" on public.parent_profiles
  for select using (auth.uid() = id);

drop policy if exists "parent_profiles_self_update" on public.parent_profiles;
create policy "parent_profiles_self_update" on public.parent_profiles
  for update using (auth.uid() = id);

drop policy if exists "kids_owner_select" on public.kids;
create policy "kids_owner_select" on public.kids
  for select using (auth.uid() = parent_id);

drop policy if exists "kids_owner_insert" on public.kids;
create policy "kids_owner_insert" on public.kids
  for insert with check (auth.uid() = parent_id);

drop policy if exists "kids_owner_update" on public.kids;
create policy "kids_owner_update" on public.kids
  for update using (auth.uid() = parent_id);

drop policy if exists "kids_owner_delete" on public.kids;
create policy "kids_owner_delete" on public.kids
  for delete using (auth.uid() = parent_id);
