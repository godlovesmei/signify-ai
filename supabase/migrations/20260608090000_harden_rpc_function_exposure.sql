-- =============================================================================
-- Harden RPC exposure for SECURITY DEFINER functions
-- =============================================================================
-- Supabase exposes functions in the public API schema through PostgREST RPC.
-- Keep privileged implementations outside exposed schemas and leave public RPC
-- names as SECURITY INVOKER wrappers.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- The timestamp trigger helper does not need elevated privileges, and it should
-- not be callable directly by API roles.
alter function public.set_updated_at()
  security invoker;

alter function public.set_updated_at()
  set search_path = '';

revoke all on function public.set_updated_at()
  from public, anon, authenticated;

-- Preference writes already have account-scoped RLS policies, so this RPC can
-- run with the caller's privileges.
alter function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  security invoker;

alter function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  set search_path = '';

grant select, insert, update on public.user_preferences to authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update on public.translation_sessions to authenticated;
grant select, insert on public.translation_entries to authenticated;
grant select, insert, delete on public.practice_attempts to authenticated;
grant select on public.model_versions to authenticated;
grant select on public.letters to authenticated;

revoke all on function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  from public, anon, authenticated;

grant execute on function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  to authenticated;

-- Move aggregate-sensitive write implementations out of the exposed public
-- schema, then recreate the public RPC surface as invoker wrappers.
alter function public.append_translation_entry(
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  text,
  text,
  timestamptz,
  timestamptz,
  text
)
  set schema private;

alter function public.record_practice_attempt(
  uuid,
  uuid,
  text,
  boolean,
  timestamptz,
  text
)
  set schema private;

alter function public.reset_practice_stats(uuid)
  set schema private;

revoke all on function private.append_translation_entry(
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  text,
  text,
  timestamptz,
  timestamptz,
  text
)
  from public, anon, authenticated;

revoke all on function private.record_practice_attempt(
  uuid,
  uuid,
  text,
  boolean,
  timestamptz,
  text
)
  from public, anon, authenticated;

revoke all on function private.reset_practice_stats(uuid)
  from public, anon, authenticated;

grant execute on function private.append_translation_entry(
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  text,
  text,
  timestamptz,
  timestamptz,
  text
)
  to authenticated;

grant execute on function private.record_practice_attempt(
  uuid,
  uuid,
  text,
  boolean,
  timestamptz,
  text
)
  to authenticated;

grant execute on function private.reset_practice_stats(uuid)
  to authenticated;

create or replace function public.append_translation_entry(
  p_expected_user_id uuid,
  p_entry_id uuid,
  p_session_id uuid,
  p_letter_code text,
  p_confidence numeric,
  p_language text default 'BISINDO',
  p_source text default 'webcam',
  p_started_at timestamptz default timezone('utc', now()),
  p_committed_at timestamptz default timezone('utc', now()),
  p_commit_method text default 'weighted_vote'
)
returns jsonb
language sql
security invoker set search_path = ''
as $$
  select private.append_translation_entry(
    p_expected_user_id,
    p_entry_id,
    p_session_id,
    p_letter_code,
    p_confidence,
    p_language,
    p_source,
    p_started_at,
    p_committed_at,
    p_commit_method
  );
$$;

create or replace function public.record_practice_attempt(
  p_expected_user_id uuid,
  p_attempt_id uuid,
  p_letter_code text,
  p_is_correct boolean,
  p_attempted_at timestamptz default timezone('utc', now()),
  p_source text default 'practice_page'
)
returns jsonb
language sql
security invoker set search_path = ''
as $$
  select private.record_practice_attempt(
    p_expected_user_id,
    p_attempt_id,
    p_letter_code,
    p_is_correct,
    p_attempted_at,
    p_source
  );
$$;

create or replace function public.reset_practice_stats(p_expected_user_id uuid)
returns jsonb
language sql
security invoker set search_path = ''
as $$
  select private.reset_practice_stats(p_expected_user_id);
$$;

revoke all on function public.append_translation_entry(
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  text,
  text,
  timestamptz,
  timestamptz,
  text
)
  from public, anon, authenticated;

revoke all on function public.record_practice_attempt(
  uuid,
  uuid,
  text,
  boolean,
  timestamptz,
  text
)
  from public, anon, authenticated;

revoke all on function public.reset_practice_stats(uuid)
  from public, anon, authenticated;

grant execute on function public.append_translation_entry(
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  text,
  text,
  timestamptz,
  timestamptz,
  text
)
  to authenticated;

grant execute on function public.record_practice_attempt(
  uuid,
  uuid,
  text,
  boolean,
  timestamptz,
  text
)
  to authenticated;

grant execute on function public.reset_practice_stats(uuid)
  to authenticated;
