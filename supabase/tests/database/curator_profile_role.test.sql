begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
  and schemaname='public' and tablename='dataset_contributions'),'Contribution changes are published for Realtime');
insert into auth.users(id,email,raw_user_meta_data) values
('88000000-0000-4000-8000-000000000001','curator-1@example.test','{}'),
('88000000-0000-4000-8000-000000000002','curator-2@example.test','{}'),
('88000000-0000-4000-8000-000000000003','curator-3@example.test','{}'),
('88000000-0000-4000-8000-000000000004','ordinary@example.test','{"role":"curator"}');
select is((select role from public.profiles where user_id='88000000-0000-4000-8000-000000000004'),'user','Auth metadata cannot assign a curator');
update public.profiles set role='curator' where user_id in (
  '88000000-0000-4000-8000-000000000001','88000000-0000-4000-8000-000000000002','88000000-0000-4000-8000-000000000003');
select is((select count(*)::int from public.profiles where role='curator'),3,'Three curator accounts coexist without grants or admin');

insert into public.dataset_video_policies(id,version,min_duration_ms,max_duration_ms,min_short_side_px,max_long_side_px,max_size_bytes,allowed_mime_types,is_active,created_by,approved_at)
values('88000000-0000-4000-8000-000000000020','profile-role-test',3000,7000,100,1000,10000,array['video/webm'],true,'88000000-0000-4000-8000-000000000001',now());
insert into public.dataset_contributions(id,user_id,proposed_label_text,video_object_path,size_bytes,duration_ms,width,height,mime_type,source_sha256,video_policy_id,validated_at,consent_version,consented_at,signer_pseudonym)
values('88000000-0000-4000-8000-000000000030','88000000-0000-4000-8000-000000000004','Word','88000000-0000-4000-8000-000000000004/88000000-0000-4000-8000-000000000030/video',1000,4000,120,160,'video/webm',repeat('a',64),'88000000-0000-4000-8000-000000000020',now(),'test',now(),'test-signer');
insert into storage.objects(bucket_id,name) select video_bucket_id,video_object_path from public.dataset_contributions;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"88000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select ok(private.is_dataset_curator(),'Profile role alone authorizes reviewer');
select ok(not private.is_dataset_admin(),'Curator does not become admin');
select is((public.dataset_access_info()->>'review_available')::boolean,true,'Review available with profile curator');
select is((select count(*)::int from public.dataset_contributions),1,'Curator reads another contributor video record');
select is((select count(*)::int from storage.objects where bucket_id='dataset-contribution-videos'),1,'Curator reads registered private video');
select throws_ok($$update public.profiles set role='admin' where user_id=auth.uid()$$,'42501',null,'Curator cannot edit own role');
select throws_ok($$select public.dataset_grant_curator('ordinary@example.test','Attempt')$$,'42501',null,'Browser cannot assign roles');
select throws_ok($$select private.dataset_grant_curator('ordinary@example.test','Attempt')$$,'42501',null,'Private legacy RPC is also disabled');
select is((public.dataset_review_contribution('88000000-0000-4000-8000-000000000030',1,'APPROVED',null,null,'Approved word')->>'status'),'APPROVED','Profile curator can approve and create a label');
reset role;

update public.profiles set role='user' where user_id='88000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"88000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select ok(not private.is_dataset_curator(),'Role removal takes effect with the same JWT');
select is((select count(*)::int from public.dataset_contributions),0,'Revocation removes cross-owner visibility');
select is((select count(*)::int from storage.objects where bucket_id='dataset-contribution-videos'),0,'Revocation prevents new private video access');
select throws_ok($$select public.dataset_review_contribution('88000000-0000-4000-8000-000000000030',2,'REJECTED',null,'Attempt')$$,'42501',null,'Revoked curator cannot review');
select set_config('request.jwt.claims','{"sub":"88000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(private.is_dataset_curator(),'Second UUID retains independent curator access');
select set_config('request.jwt.claims','{"sub":"88000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select ok(private.is_dataset_curator(),'Third UUID retains independent curator access');
select set_config('request.jwt.claims','{"sub":"88000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
select ok(not private.is_dataset_curator(),'Ordinary contributor cannot become reviewer');
select throws_ok($$update public.profiles set role='curator' where user_id=auth.uid()$$,'42501',null,'Ordinary contributor cannot promote own role');
reset role;
update public.profiles set role='user' where role='curator';
select is((public.dataset_access_info()->>'review_available')::boolean,false,'Review unavailable after last curator removed');
select throws_ok($$update public.dataset_video_policies set min_duration_ms=1000 where is_active$$,
  '23514',null,'Active policies cannot reopen recording below 3 seconds');
select throws_ok($$update public.dataset_video_policies set max_duration_ms=10000 where is_active$$,
  '23514',null,'Active policies cannot extend recording above 7 seconds');
create function pg_temp.insert_duration_test(p_duration integer) returns void language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into public.dataset_contributions(id,user_id,proposed_label_text,video_object_path,
    size_bytes,duration_ms,width,height,mime_type,source_sha256,video_policy_id,validated_at,
    consent_version,consented_at,signer_pseudonym)
  values(v_id,'88000000-0000-4000-8000-000000000004','Boundary',
    '88000000-0000-4000-8000-000000000004/'||v_id||'/video',1000,p_duration,120,160,
    'video/webm',repeat('b',64),'88000000-0000-4000-8000-000000000020',now(),'test',now(),'test-signer');
end; $$;
select throws_ok($$select pg_temp.insert_duration_test(2999)$$,'23514',null,'Database rejects duration below 3 seconds');
select lives_ok($$select pg_temp.insert_duration_test(3000)$$,'Database accepts exactly 3 seconds');
select lives_ok($$select pg_temp.insert_duration_test(7000)$$,'Database accepts exactly 7 seconds');
select throws_ok($$select pg_temp.insert_duration_test(7001)$$,'23514',null,'Database rejects duration above 7 seconds');
select * from finish();
rollback;
