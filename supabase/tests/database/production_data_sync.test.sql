begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'one@example.com', '{"full_name":"User One"}'),
  ('22222222-2222-4222-8222-222222222222', 'two@example.com', '{"full_name":"User Two"}');

select is(
  (select count(*)::integer from public.profiles where user_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )),
  2,
  'TC-021 Auth trigger creates profiles'
);

select is(
  (select count(*)::integer from public.user_preferences where user_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )),
  2,
  'TC-021 Auth trigger creates preferences'
);

select ok(
  not exists (
    select 1
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where p.user_id is null
  ),
  'TC-021 Every existing Auth user has a backfilled profile'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.append_translation_entry(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'A',
    0.9,
    'BISINDO',
    'webcam',
    '2026-06-05T01:00:00Z',
    '2026-06-05T01:00:01Z',
    'weighted_vote'
  )$$,
  'TC-021 A translation entry can be appended'
);

select lives_ok(
  $$select public.append_translation_entry(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'A',
    0.9,
    'BISINDO',
    'webcam',
    '2026-06-05T01:00:00Z',
    '2026-06-05T01:00:01Z',
    'weighted_vote'
  )$$,
  'TC-021 Translation retry is idempotent'
);

select throws_ok(
  $$select public.append_translation_entry(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9',
    '<script>',
    0.9
  )$$,
  '22023',
  null,
  'TC-021 Translation RPC rejects invalid letter input'
);

select throws_ok(
  $$select public.upsert_user_preferences('neon', false, 1, 1, 0.8)$$,
  '23514',
  null,
  'TC-018 Preference RPC rejects values outside database constraints'
);

select throws_ok(
  $$insert into public.model_versions
    (model_name, model_version, artifact_path)
    values ('restricted-test', 'v1', '/tmp/restricted.pt')$$,
  '42501',
  null,
  'TC-020 Regular users cannot write model registry rows'
);

select lives_ok(
  $$select public.append_translation_entry(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'B',
    0.8,
    'BISINDO',
    'webcam',
    '2026-06-05T01:00:00Z',
    '2026-06-05T01:00:02Z',
    'weighted_vote'
  )$$,
  'TC-021 A second translation entry can be appended in order'
);

select is(
  (select count(*)::integer from public.translation_entries),
  2,
  'TC-021 Idempotent translation retry does not duplicate entries'
);

select is(
  (select entry_count from public.translation_sessions where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  2,
  'TC-021 Session aggregate entry count is maintained'
);

select is(
  (select committed_text from public.translation_sessions where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  'AB',
  'TC-021 Session committed text is maintained'
);

select is(
  (select sequence_no from public.translation_entries where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  2,
  'TC-021 Translation entry sequence is maintained'
);

select lives_ok(
  $$select public.record_practice_attempt(
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'A', true, '2026-06-05T02:00:01Z', 'practice_page'
  )$$,
  'TC-015 A practice attempt can be recorded'
);
select lives_ok(
  $$select public.record_practice_attempt(
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'A', true, '2026-06-05T02:00:02Z', 'practice_page'
  )$$,
  'TC-015 A second practice attempt can be recorded'
);
select lives_ok(
  $$select public.record_practice_attempt(
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'B', false, '2026-06-05T02:00:03Z', 'practice_page'
  )$$,
  'TC-015 An incorrect practice attempt can be recorded'
);
select lives_ok(
  $$select public.record_practice_attempt(
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'B', true, '2026-06-05T02:00:04Z', 'practice_page'
  )$$,
  'TC-015 Practice streak resumes after an incorrect attempt'
);

select is(
  (public.get_practice_stats() ->> 'currentStreak')::integer,
  1,
  'TC-017 Current streak is calculated from the latest attempts'
);

select is(
  (public.get_practice_stats() ->> 'bestStreak')::integer,
  2,
  'TC-017 Best streak is calculated across all attempts'
);

select lives_ok(
  $$select public.reset_practice_stats('11111111-1111-4111-8111-111111111111')$$,
  'TC-016 Practice progress can be reset'
);

select is(
  (public.get_practice_stats() ->> 'totalAttempts')::integer,
  0,
  'TC-016 Reset removes all practice attempts for the current user'
);

select throws_ok(
  $$update public.profiles
    set role = 'admin'
    where user_id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  null,
  'TC-020 Authenticated users cannot promote their own role'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.translation_sessions),
  0,
  'TC-021 RLS isolates translation sessions between users'
);

select is(
  (select count(*)::integer from public.user_preferences),
  1,
  'TC-021 RLS isolates preferences between users'
);

select throws_ok(
  $$select public.append_translation_entry(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'C',
    0.7
  )$$,
  '42501',
  null,
  'TC-021 Queued writes are rejected when the authenticated user changes'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'graphql_public')
      and p.prosecdef
      and (
        pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
        or pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  ),
  0,
  'TC-022 API roles cannot execute exposed security definer functions'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.prosecdef
      and p.proname in (
        'append_translation_entry',
        'record_practice_attempt',
        'reset_practice_stats'
      )
  ),
  3,
  'TC-022 Sensitive write implementations remain private security definer functions'
);

select ok(
  not pg_catalog.has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE')
  and not pg_catalog.has_function_privilege('authenticated', 'public.set_updated_at()', 'EXECUTE'),
  'TC-022 Timestamp trigger helper is not executable by API roles'
);

reset role;

update public.profiles
set role = 'admin'
where user_id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.model_versions
    (model_name, model_version, artifact_path)
    values ('admin-test', 'v1', '/tmp/admin.pt')$$,
  'TC-020 Admins can write model registry rows'
);

reset role;

delete from auth.users where id = '11111111-1111-4111-8111-111111111111';

select is(
  (select count(*)::integer from public.translation_sessions where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  0,
  'TC-021 Deleting an account cascades to translation history'
);

select * from finish();

rollback;
