-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.gym_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  workout_id text not null,
  exercise_key text not null,
  weight text not null default '',
  updated_at timestamptz not null default now(),
  constraint gym_entries_user_day_workout_exercise unique (user_id, session_date, workout_id, exercise_key)
);

create index if not exists gym_entries_user_session_idx on public.gym_entries (user_id, session_date desc);

alter table public.gym_entries enable row level security;

create policy "gym_select_own" on public.gym_entries
  for select using (auth.uid() = user_id);

create policy "gym_insert_own" on public.gym_entries
  for insert with check (auth.uid() = user_id);

create policy "gym_update_own" on public.gym_entries
  for update using (auth.uid() = user_id);

create policy "gym_delete_own" on public.gym_entries
  for delete using (auth.uid() = user_id);
