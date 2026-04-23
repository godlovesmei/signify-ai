-- =============================================================================
-- Signify AI — Initial Schema Migration
-- Version: 2.0 (YOLO11 architecture)
-- Database: Supabase / PostgreSQL 15+
-- =============================================================================
-- Tables:
--   profiles               User profile linked to auth.users
--   model_versions         ML model registry (active flag, one active per model)
--   letters                BISINDO alphabet A–Z (seeded)
--   translation_sessions   Per-session webcam/upload translation records
--   translation_entries    Individual letter commits within a session
--   practice_attempts      Per-letter practice correctness records
--   user_preferences       User UI/accessibility settings
--
-- Views:
--   practice_letter_stats  Accuracy aggregates per user per letter
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Reusable updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new user signs up via Supabase Auth
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id      uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  role         text        not null default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: model_versions
-- ---------------------------------------------------------------------------
create table if not exists public.model_versions (
  id                   uuid           primary key default gen_random_uuid(),
  model_name           text           not null,
  model_version        text           not null,
  architecture         text           not null default 'yolo11',
  artifact_path        text           not null,
  map50                numeric(5, 4),
  map50_95             numeric(5, 4),
  input_size           integer        not null default 640 check (input_size > 0),
  confidence_threshold numeric(4, 3)  not null default 0.500
    check (confidence_threshold >= 0 and confidence_threshold <= 1),
  is_active            boolean        not null default false,
  released_at          timestamptz,
  created_at           timestamptz    not null default timezone('utc', now()),
  updated_at           timestamptz    not null default timezone('utc', now()),
  unique (model_name, model_version)
);

drop trigger if exists trg_model_versions_updated_at on public.model_versions;
create trigger trg_model_versions_updated_at
  before update on public.model_versions
  for each row execute function public.set_updated_at();

-- Enforce: at most one active version per model_name
create unique index if not exists idx_model_versions_one_active
  on public.model_versions (model_name)
  where is_active;

-- ---------------------------------------------------------------------------
-- Seed: YOLO11 bisindo_v1 model (mAP50=0.995, mAP50-95=0.926)
-- ---------------------------------------------------------------------------
insert into public.model_versions
  (model_name, model_version, architecture, artifact_path, map50, map50_95,
   input_size, confidence_threshold, is_active, released_at)
values
  ('bisindo', 'v1', 'yolo11', 'models/exports/bisindo_yolo/best.pt',
   0.9950, 0.9260, 640, 0.500, true, timezone('utc', now()))
on conflict (model_name, model_version) do nothing;

-- ---------------------------------------------------------------------------
-- Table: letters
-- ---------------------------------------------------------------------------
create table if not exists public.letters (
  code               char(1)     primary key check (code ~ '^[A-Z]$'),
  display_name       text        not null,
  reference_image_url text,
  is_active          boolean     not null default true,
  created_at         timestamptz not null default timezone('utc', now())
);

-- Seed alphabet A–Z
insert into public.letters (code, display_name)
select chr(cp), chr(cp)
from generate_series(ascii('A'), ascii('Z')) as g(cp)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Table: translation_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.translation_sessions (
  id               uuid           primary key default gen_random_uuid(),
  user_id          uuid           references public.profiles(user_id) on delete set null,
  model_version_id uuid           references public.model_versions(id) on delete set null,
  language         text           not null default 'BISINDO'
    check (language in ('BISINDO', 'ASL')),
  source           text           not null default 'webcam'
    check (source in ('webcam', 'upload', 'api')),
  started_at       timestamptz    not null default timezone('utc', now()),
  ended_at         timestamptz,
  average_confidence numeric(4, 3)
    check (average_confidence is null or (average_confidence >= 0 and average_confidence <= 1)),
  committed_text   text           not null default '',
  created_at       timestamptz    not null default timezone('utc', now()),
  constraint chk_session_ended_has_confidence
    check (ended_at is null or average_confidence is not null or committed_text = '')
);

create index if not exists idx_sessions_user_started
  on public.translation_sessions (user_id, started_at desc);

create index if not exists idx_sessions_model_version
  on public.translation_sessions (model_version_id);

-- Efficient query for open sessions (ended_at IS NULL)
create index if not exists idx_sessions_open
  on public.translation_sessions (user_id)
  where ended_at is null;

-- ---------------------------------------------------------------------------
-- Table: translation_entries
-- ---------------------------------------------------------------------------
create table if not exists public.translation_entries (
  id            uuid           primary key default gen_random_uuid(),
  session_id    uuid           not null references public.translation_sessions(id) on delete cascade,
  sequence_no   integer        not null check (sequence_no > 0),
  letter_code   char(1)        not null references public.letters(code),
  confidence    numeric(4, 3)  not null check (confidence >= 0 and confidence <= 1),
  commit_method text           not null default 'weighted_vote'
    check (commit_method in ('weighted_vote', 'fast_commit', 'manual')),
  committed_at  timestamptz    not null default timezone('utc', now()),
  created_at    timestamptz    not null default timezone('utc', now()),
  unique (session_id, sequence_no)
);

create index if not exists idx_entries_session_committed
  on public.translation_entries (session_id, committed_at);

-- ---------------------------------------------------------------------------
-- Table: practice_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.practice_attempts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(user_id) on delete cascade,
  letter_code  char(1)     not null references public.letters(code),
  is_correct   boolean     not null,
  source       text        not null default 'practice_page',
  attempted_at timestamptz not null default timezone('utc', now()),
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists idx_practice_user_attempted
  on public.practice_attempts (user_id, attempted_at desc);

create index if not exists idx_practice_user_letter
  on public.practice_attempts (user_id, letter_code);

-- ---------------------------------------------------------------------------
-- Table: user_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id       uuid           primary key references public.profiles(user_id) on delete cascade,
  theme         text           not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  high_contrast boolean        not null default false,
  text_scale    numeric(3, 2)  not null default 1.00
    check (text_scale >= 0.80 and text_scale <= 1.50),
  tts_speed     numeric(3, 2)  not null default 1.00
    check (tts_speed >= 0.50 and tts_speed <= 2.00),
  tts_volume    numeric(3, 2)  not null default 0.80
    check (tts_volume >= 0.00 and tts_volume <= 1.00),
  created_at    timestamptz    not null default timezone('utc', now()),
  updated_at    timestamptz    not null default timezone('utc', now())
);

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Convenience upsert for syncing frontend preferences to the database
create or replace function public.upsert_user_preferences(
  p_theme         text    default 'system',
  p_high_contrast boolean default false,
  p_text_scale    numeric default 1.00,
  p_tts_speed     numeric default 1.00,
  p_tts_volume    numeric default 0.80
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_preferences
    (user_id, theme, high_contrast, text_scale, tts_speed, tts_volume)
  values
    (auth.uid(), p_theme, p_high_contrast, p_text_scale, p_tts_speed, p_tts_volume)
  on conflict (user_id) do update set
    theme         = excluded.theme,
    high_contrast = excluded.high_contrast,
    text_scale    = excluded.text_scale,
    tts_speed     = excluded.tts_speed,
    tts_volume    = excluded.tts_volume,
    updated_at    = timezone('utc', now());
end;
$$;

-- ---------------------------------------------------------------------------
-- View: practice_letter_stats
-- (inherits RLS from practice_attempts — users only see their own rows)
-- ---------------------------------------------------------------------------
create or replace view public.practice_letter_stats
with (security_invoker = true)
as
select
  pa.user_id,
  pa.letter_code,
  count(*)::bigint                                                        as attempts,
  sum(case when pa.is_correct then 1 else 0 end)::bigint                 as correct,
  round(
    sum(case when pa.is_correct then 1 else 0 end)::numeric
      / nullif(count(*), 0),
    3
  )                                                                       as accuracy
from public.practice_attempts pa
group by pa.user_id, pa.letter_code;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.model_versions      enable row level security;
alter table public.letters             enable row level security;
alter table public.translation_sessions enable row level security;
alter table public.translation_entries enable row level security;
alter table public.practice_attempts   enable row level security;
alter table public.user_preferences    enable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_insert_own   on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── model_versions — public read, admin write ──────────────────────────────
drop policy if exists model_versions_read_all    on public.model_versions;
drop policy if exists model_versions_admin_write on public.model_versions;

create policy model_versions_read_all on public.model_versions
  for select using (true);

create policy model_versions_admin_write on public.model_versions
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ── letters — public read ──────────────────────────────────────────────────
drop policy if exists letters_read_all on public.letters;

create policy letters_read_all on public.letters
  for select using (true);

-- ── translation_sessions ───────────────────────────────────────────────────
drop policy if exists sessions_select_own on public.translation_sessions;
drop policy if exists sessions_insert_own on public.translation_sessions;
drop policy if exists sessions_update_own on public.translation_sessions;
drop policy if exists sessions_delete_own on public.translation_sessions;

create policy sessions_select_own on public.translation_sessions
  for select using (user_id = auth.uid());

create policy sessions_insert_own on public.translation_sessions
  for insert with check (user_id = auth.uid());

create policy sessions_update_own on public.translation_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sessions_delete_own on public.translation_sessions
  for delete using (user_id = auth.uid());

-- ── translation_entries ────────────────────────────────────────────────────
drop policy if exists entries_select_own on public.translation_entries;
drop policy if exists entries_insert_own on public.translation_entries;
drop policy if exists entries_update_own on public.translation_entries;
drop policy if exists entries_delete_own on public.translation_entries;

create policy entries_select_own on public.translation_entries
  for select using (
    exists (
      select 1 from public.translation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy entries_insert_own on public.translation_entries
  for insert with check (
    exists (
      select 1 from public.translation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy entries_update_own on public.translation_entries
  for update
  using (
    exists (
      select 1 from public.translation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.translation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy entries_delete_own on public.translation_entries
  for delete using (
    exists (
      select 1 from public.translation_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ── practice_attempts ──────────────────────────────────────────────────────
drop policy if exists practice_select_own on public.practice_attempts;
drop policy if exists practice_insert_own on public.practice_attempts;
drop policy if exists practice_update_own on public.practice_attempts;
drop policy if exists practice_delete_own on public.practice_attempts;

create policy practice_select_own on public.practice_attempts
  for select using (user_id = auth.uid());

create policy practice_insert_own on public.practice_attempts
  for insert with check (user_id = auth.uid());

create policy practice_update_own on public.practice_attempts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy practice_delete_own on public.practice_attempts
  for delete using (user_id = auth.uid());

-- ── user_preferences ───────────────────────────────────────────────────────
drop policy if exists prefs_select_own on public.user_preferences;
drop policy if exists prefs_insert_own on public.user_preferences;
drop policy if exists prefs_update_own on public.user_preferences;

create policy prefs_select_own on public.user_preferences
  for select using (user_id = auth.uid());

create policy prefs_insert_own on public.user_preferences
  for insert with check (user_id = auth.uid());

create policy prefs_update_own on public.user_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
