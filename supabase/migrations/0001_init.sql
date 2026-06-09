-- Aftertaste schema: profiles, dish_logs (multi-dimensional ratings), attachments.
-- Row-Level Security is added in 0002_rls.sql; storage in 0003_storage.sql.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles: 1:1 mirror of auth.users. `role` drives admin gating.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  display_name      text,
  avatar_url        text,
  role              text not null default 'user' check (role in ('user', 'admin')),
  local_migrated_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-provision a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- dish_logs: one tasting entry. Ratings are per-facet (1-10); `rating_overall`
-- is a generated column = rounded mean of the facets that were provided.
-- ---------------------------------------------------------------------------
create table if not exists public.dish_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  restaurant_id   text,
  restaurant_name text not null,
  dish_id         text,
  dish_name       text not null,
  dish_category   text,
  source          text not null default 'manual'
                  check (source in ('manual', 'places', 'legacy_local')),

  rating_taste    smallint check (rating_taste    between 1 and 10),
  rating_ambience smallint check (rating_ambience between 1 and 10),
  rating_service  smallint check (rating_service  between 1 and 10),

  rating_overall numeric(3,1) generated always as (
    round(
      ( coalesce(rating_taste,0) + coalesce(rating_ambience,0)
      + coalesce(rating_service,0) )::numeric
      / nullif(
          (case when rating_taste    is not null then 1 else 0 end)
        + (case when rating_ambience is not null then 1 else 0 end)
        + (case when rating_service  is not null then 1 else 0 end), 0)
    , 1)
  ) stored,

  rating_legacy smallint check (rating_legacy between 1 and 10),  -- migrated single score
  comment       text check (char_length(comment) <= 5000),
  stamps        text[] not null default '{}',
  links         text[] not null default '{}',
  legacy_id     text,

  logged_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id, legacy_id)
);

create index if not exists dish_logs_user_logged_idx  on public.dish_logs (user_id, logged_at desc);
create index if not exists dish_logs_user_overall_idx on public.dish_logs (user_id, rating_overall desc);

-- ---------------------------------------------------------------------------
-- attachments: bytes live in Storage (private bucket); metadata lives here.
-- storage_path is prefixed with the owner's user_id so one path-based policy
-- enforces ownership of the actual files.
-- ---------------------------------------------------------------------------
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  dish_log_id  uuid not null references public.dish_logs(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('photo', 'voice')),
  storage_path text not null,
  file_name    text,
  mime_type    text,
  duration_sec int,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

create index if not exists attachments_dish_log_idx on public.attachments (dish_log_id);
create index if not exists attachments_user_idx     on public.attachments (user_id);
