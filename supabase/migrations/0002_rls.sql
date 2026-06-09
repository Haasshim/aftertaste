-- Row-Level Security. This is the actual privacy boundary: PostgREST runs every
-- request as role `authenticated` with auth.uid() bound to the caller's JWT.
-- With RLS forced, Postgres only returns/accepts rows a policy permits, so one
-- user can never read or write another user's data — enforced in the database,
-- not in bypassable app code.

-- profiles --------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- A user may edit their own profile but CANNOT change their own role
-- (the with-check pins role to its current value -> no self-promotion to admin).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );
-- Inserts happen via the security-definer signup trigger; no client insert policy.

-- dish_logs -------------------------------------------------------------------
alter table public.dish_logs enable row level security;
alter table public.dish_logs force row level security;

drop policy if exists dish_logs_select_own on public.dish_logs;
create policy dish_logs_select_own on public.dish_logs
  for select using (auth.uid() = user_id);

-- Ownership-on-write: a request that stamps someone else's user_id is rejected.
drop policy if exists dish_logs_insert_own on public.dish_logs;
create policy dish_logs_insert_own on public.dish_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists dish_logs_update_own on public.dish_logs;
create policy dish_logs_update_own on public.dish_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists dish_logs_delete_own on public.dish_logs;
create policy dish_logs_delete_own on public.dish_logs
  for delete using (auth.uid() = user_id);

-- attachments -----------------------------------------------------------------
alter table public.attachments enable row level security;
alter table public.attachments force row level security;

drop policy if exists attachments_all_own on public.attachments;
create policy attachments_all_own on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
