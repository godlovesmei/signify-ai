-- =============================================================================
-- Signify AI - Production data synchronization
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Backfill Auth users created before the initial profile trigger existed.
-- ---------------------------------------------------------------------------
insert into public.profiles (user_id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    u.email
  ),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  )
from auth.users u
on conflict (user_id) do nothing;

insert into public.user_preferences (user_id)
select p.user_id
from public.profiles p
on conflict (user_id) do nothing;

-- Keep translation history owned by an account for its entire lifetime.
alter table public.translation_sessions
  drop constraint if exists translation_sessions_user_id_fkey;

alter table public.translation_sessions
  add constraint translation_sessions_user_id_fkey
  foreign key (user_id) references public.profiles(user_id) on delete cascade;

alter table public.translation_sessions
  add column if not exists entry_count integer not null default 0
  check (entry_count >= 0);

update public.translation_sessions s
set entry_count = counts.entry_count
from (
  select session_id, count(*)::integer as entry_count
  from public.translation_entries
  group by session_id
) counts
where s.id = counts.session_id;

-- ---------------------------------------------------------------------------
-- Harden Auth-triggered bootstrap.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      new.email
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  )
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies with explicit authenticated roles.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists model_versions_read_all on public.model_versions;
drop policy if exists model_versions_admin_write on public.model_versions;

create policy model_versions_read_all on public.model_versions
  for select to anon, authenticated
  using (true);

create policy model_versions_admin_write on public.model_versions
  for all to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists letters_read_all on public.letters;

create policy letters_read_all on public.letters
  for select to anon, authenticated
  using (true);

drop policy if exists sessions_select_own on public.translation_sessions;
drop policy if exists sessions_insert_own on public.translation_sessions;
drop policy if exists sessions_update_own on public.translation_sessions;
drop policy if exists sessions_delete_own on public.translation_sessions;

create policy sessions_select_own on public.translation_sessions
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy sessions_insert_own on public.translation_sessions
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy sessions_update_own on public.translation_sessions
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy sessions_delete_own on public.translation_sessions
  for delete to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists entries_select_own on public.translation_entries;
drop policy if exists entries_insert_own on public.translation_entries;
drop policy if exists entries_update_own on public.translation_entries;
drop policy if exists entries_delete_own on public.translation_entries;

create policy entries_select_own on public.translation_entries
  for select to authenticated
  using (
    exists (
      select 1
      from public.translation_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy entries_insert_own on public.translation_entries
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.translation_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy entries_update_own on public.translation_entries
  for update to authenticated
  using (
    exists (
      select 1
      from public.translation_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.translation_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy entries_delete_own on public.translation_entries
  for delete to authenticated
  using (
    exists (
      select 1
      from public.translation_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

drop policy if exists practice_select_own on public.practice_attempts;
drop policy if exists practice_insert_own on public.practice_attempts;
drop policy if exists practice_update_own on public.practice_attempts;
drop policy if exists practice_delete_own on public.practice_attempts;

create policy practice_select_own on public.practice_attempts
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy practice_insert_own on public.practice_attempts
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy practice_update_own on public.practice_attempts
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy practice_delete_own on public.practice_attempts
  for delete to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists prefs_select_own on public.user_preferences;
drop policy if exists prefs_insert_own on public.user_preferences;
drop policy if exists prefs_update_own on public.user_preferences;

create policy prefs_select_own on public.user_preferences
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy prefs_insert_own on public.user_preferences
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy prefs_update_own on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- A user profile is trigger-created. Users may only update public profile fields.
revoke insert, update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Aggregate-sensitive writes must go through the atomic RPCs below.
revoke insert, update on public.translation_sessions from authenticated;
revoke insert, update, delete on public.translation_entries from authenticated;
revoke insert, update, delete on public.practice_attempts from authenticated;

-- ---------------------------------------------------------------------------
-- Shared preference upsert.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_user_preferences(
  p_theme         text    default 'system',
  p_high_contrast boolean default false,
  p_text_scale    numeric default 1.00,
  p_tts_speed     numeric default 1.00,
  p_tts_volume    numeric default 0.80
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.user_preferences
    (user_id, theme, high_contrast, text_scale, tts_speed, tts_volume)
  values
    (v_user_id, p_theme, p_high_contrast, p_text_scale, p_tts_speed, p_tts_volume)
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
-- Translation history RPCs.
-- ---------------------------------------------------------------------------
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
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_letter_code char(1) := upper(trim(p_letter_code))::char(1);
  v_existing_session uuid;
  v_owner uuid;
  v_entry_count integer;
  v_average_confidence numeric;
  v_inserted integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if v_user_id is distinct from p_expected_user_id then
    raise exception 'Authenticated user changed before write execution' using errcode = '42501';
  end if;

  if p_entry_id is null or p_session_id is null then
    raise exception 'Entry and session IDs are required' using errcode = '22023';
  end if;

  if length(trim(p_letter_code)) <> 1 or upper(trim(p_letter_code)) !~ '^[A-Z]$' then
    raise exception 'Invalid letter code' using errcode = '22023';
  end if;

  select te.session_id
  into v_existing_session
  from public.translation_entries te
  where te.id = p_entry_id;

  if found then
    if v_existing_session <> p_session_id then
      raise exception 'Entry ID already belongs to another session' using errcode = '23505';
    end if;

    select s.user_id, s.entry_count
    into v_owner, v_entry_count
    from public.translation_sessions s
    where s.id = p_session_id;

    if v_owner is distinct from v_user_id then
      raise exception 'Session does not belong to the authenticated user' using errcode = '42501';
    end if;

    return jsonb_build_object(
      'entry_id', p_entry_id,
      'session_id', p_session_id,
      'entry_count', v_entry_count,
      'idempotent', true
    );
  end if;

  insert into public.translation_sessions (
    id,
    user_id,
    model_version_id,
    language,
    source,
    started_at
  )
  values (
    p_session_id,
    v_user_id,
    (
      select mv.id
      from public.model_versions mv
      where mv.model_name = 'bisindo' and mv.is_active
      limit 1
    ),
    p_language,
    p_source,
    p_started_at
  )
  on conflict (id) do nothing;

  select s.user_id, s.entry_count, s.average_confidence
  into v_owner, v_entry_count, v_average_confidence
  from public.translation_sessions s
  where s.id = p_session_id
  for update;

  if not found or v_owner is distinct from v_user_id then
    raise exception 'Session does not belong to the authenticated user' using errcode = '42501';
  end if;

  insert into public.translation_entries (
    id,
    session_id,
    sequence_no,
    letter_code,
    confidence,
    commit_method,
    committed_at
  )
  values (
    p_entry_id,
    p_session_id,
    v_entry_count + 1,
    v_letter_code,
    p_confidence,
    p_commit_method,
    p_committed_at
  )
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select te.session_id
    into v_existing_session
    from public.translation_entries te
    where te.id = p_entry_id;

    if v_existing_session is distinct from p_session_id then
      raise exception 'Entry ID already belongs to another session' using errcode = '23505';
    end if;

    return jsonb_build_object(
      'entry_id', p_entry_id,
      'session_id', p_session_id,
      'entry_count', v_entry_count,
      'idempotent', true
    );
  end if;

  update public.translation_sessions
  set
    ended_at = greatest(coalesce(ended_at, p_committed_at), p_committed_at),
    committed_text = committed_text || v_letter_code,
    average_confidence = (
      (coalesce(v_average_confidence, 0) * v_entry_count) + p_confidence
    ) / (v_entry_count + 1),
    entry_count = v_entry_count + 1
  where id = p_session_id;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'session_id', p_session_id,
    'entry_count', v_entry_count + 1,
    'idempotent', false
  );
end;
$$;

create or replace function public.get_translation_history_totals()
returns jsonb
language sql
stable
security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'session_count', count(*)::integer,
    'entry_count', coalesce(sum(s.entry_count), 0)::integer
  )
  from public.translation_sessions s
  where s.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Practice RPCs.
-- ---------------------------------------------------------------------------
create or replace function public.get_practice_stats()
returns jsonb
language plpgsql
security invoker set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_total integer := 0;
  v_correct integer := 0;
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_last_played_at timestamptz;
  v_by_letter jsonb := '{}'::jsonb;
  v_attempt record;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select
    count(*)::integer,
    count(*) filter (where pa.is_correct)::integer,
    max(pa.attempted_at)
  into v_total, v_correct, v_last_played_at
  from public.practice_attempts pa
  where pa.user_id = v_user_id;

  for v_attempt in
    select pa.is_correct
    from public.practice_attempts pa
    where pa.user_id = v_user_id
    order by pa.attempted_at, pa.created_at, pa.id
  loop
    if v_attempt.is_correct then
      v_current_streak := v_current_streak + 1;
      v_best_streak := greatest(v_best_streak, v_current_streak);
    else
      v_current_streak := 0;
    end if;
  end loop;

  select coalesce(
    jsonb_object_agg(
      l.code::text,
      jsonb_build_object(
        'attempts', coalesce(stats.attempts, 0),
        'correct', coalesce(stats.correct, 0)
      )
      order by l.code
    ),
    '{}'::jsonb
  )
  into v_by_letter
  from public.letters l
  left join (
    select
      pa.letter_code,
      count(*)::integer as attempts,
      count(*) filter (where pa.is_correct)::integer as correct
    from public.practice_attempts pa
    where pa.user_id = v_user_id
    group by pa.letter_code
  ) stats on stats.letter_code = l.code
  where l.is_active;

  return jsonb_build_object(
    'totalAttempts', v_total,
    'correctAttempts', v_correct,
    'currentStreak', v_current_streak,
    'bestStreak', v_best_streak,
    'lastPlayedAt', v_last_played_at,
    'byLetter', v_by_letter
  );
end;
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
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_letter_code char(1) := upper(trim(p_letter_code))::char(1);
  v_existing_user uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if v_user_id is distinct from p_expected_user_id then
    raise exception 'Authenticated user changed before write execution' using errcode = '42501';
  end if;

  if p_attempt_id is null then
    raise exception 'Attempt ID is required' using errcode = '22023';
  end if;

  if length(trim(p_letter_code)) <> 1 or upper(trim(p_letter_code)) !~ '^[A-Z]$' then
    raise exception 'Invalid letter code' using errcode = '22023';
  end if;

  insert into public.practice_attempts (
    id,
    user_id,
    letter_code,
    is_correct,
    source,
    attempted_at
  )
  values (
    p_attempt_id,
    v_user_id,
    v_letter_code,
    p_is_correct,
    p_source,
    p_attempted_at
  )
  on conflict (id) do nothing;

  select pa.user_id
  into v_existing_user
  from public.practice_attempts pa
  where pa.id = p_attempt_id;

  if v_existing_user is distinct from v_user_id then
    raise exception 'Attempt ID belongs to another user' using errcode = '42501';
  end if;

  return public.get_practice_stats();
end;
$$;

create or replace function public.reset_practice_stats(p_expected_user_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if v_user_id is distinct from p_expected_user_id then
    raise exception 'Authenticated user changed before write execution' using errcode = '42501';
  end if;

  delete from public.practice_attempts
  where user_id = v_user_id;

  return public.get_practice_stats();
end;
$$;

-- Functions are private by default; expose only the account-scoped RPCs.
revoke all on function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.append_translation_entry(uuid, uuid, uuid, text, numeric, text, text, timestamptz, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.get_translation_history_totals()
  from public, anon, authenticated;
revoke all on function public.get_practice_stats()
  from public, anon, authenticated;
revoke all on function public.record_practice_attempt(uuid, uuid, text, boolean, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.reset_practice_stats(uuid)
  from public, anon, authenticated;

grant execute on function public.upsert_user_preferences(text, boolean, numeric, numeric, numeric)
  to authenticated;
grant execute on function public.append_translation_entry(uuid, uuid, uuid, text, numeric, text, text, timestamptz, timestamptz, text)
  to authenticated;
grant execute on function public.get_translation_history_totals()
  to authenticated;
grant execute on function public.get_practice_stats()
  to authenticated;
grant execute on function public.record_practice_attempt(uuid, uuid, text, boolean, timestamptz, text)
  to authenticated;
grant execute on function public.reset_practice_stats(uuid)
  to authenticated;
