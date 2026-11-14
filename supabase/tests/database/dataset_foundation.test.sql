begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Synthetic fixtures only: these values are NOT final video requirements.


select is((select count(*)::integer from public.dataset_video_policies where is_active), 0, 'No final video policy or pilot limits are seeded');

select is((select count(*)::integer from private.dataset_curator_grants), 0, 'No admin is automatically assigned as a competent curator');

select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('dataset_labels','dataset_contributions','dataset_curation_reviews','dataset_notifications','dataset_exports','dataset_export_items','dataset_video_policies') and c.relrowsecurity), 7, 'Every public dataset table has RLS');

select ok(not exists (select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey) where c.conrelid='public.dataset_contributions'::regclass and c.contype='f' and a.attname='recognition_event_id'), 'Optional recognition reference has no FK to Meiske tables');

select is((select count(*)::integer from storage.buckets where id in ('dataset-contribution-videos','dataset-export-archives') and not public), 2, 'Video and export buckets are private');

insert into auth.users (id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','dataset-one@example.test','{}'), ('10000000-0000-4000-8000-000000000002','dataset-two@example.test','{}'),
('20000000-0000-4000-8000-000000000001','curator-one@example.test','{}'), ('20000000-0000-4000-8000-000000000002','curator-two@example.test','{}'),
('20000000-0000-4000-8000-000000000003','technical-admin@example.test','{}'),
('20000000-0000-4000-8000-000000000004','technical-admin-two@example.test','{}');
update public.profiles set role='admin' where user_id in ('20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004');
update public.profiles set role='curator' where user_id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
insert into private.dataset_curator_grants (user_id,granted_by,qualification_note) values
('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Synthetic reviewer assignment A'),
('20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','Synthetic reviewer assignment B'),
('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','Revoked reviewer assignment');
update private.dataset_curator_grants set revoked_at=now() where user_id='10000000-0000-4000-8000-000000000002';
insert into public.dataset_labels (id,code,display_name,is_active) values
('30000000-0000-4000-8000-000000000001','test_one','Test One',true), ('30000000-0000-4000-8000-000000000002','test_two','Test Two',true),
('30000000-0000-4000-8000-000000000003','test_inactive','Inactive',false);
insert into public.dataset_video_policies
(id,version,min_duration_ms,max_duration_ms,min_short_side_px,max_long_side_px,max_size_bytes,
 allowed_mime_types,is_active,created_by,approved_at)
values ('40000000-0000-4000-8000-000000000001','synthetic-fixture-v1',3000,7000,100,1000,10000,
array['video/webm'],true,'20000000-0000-4000-8000-000000000003',now());
insert into public.dataset_video_policies (id,version,created_by)
values ('40000000-0000-4000-8000-000000000002','unconfigured-draft','20000000-0000-4000-8000-000000000003');

create function pg_temp.dataset_seed(
 p_id uuid, p_owner uuid, p_policy uuid default '40000000-0000-4000-8000-000000000001',
 p_event uuid default null, p_size bigint default 1000
) returns void language sql security invoker set search_path='' as $seed$
 insert into public.dataset_contributions
 (id,user_id,recognition_event_id,proposed_label_id,video_object_path,size_bytes,duration_ms,width,height,
 mime_type,source_sha256,video_policy_id,validated_at,consent_version,consented_at,signer_pseudonym)
 values (p_id,p_owner,p_event,'30000000-0000-4000-8000-000000000001',p_owner::text||'/'||p_id::text||'/video',p_size,4000,120,160,
 'video/webm',repeat('a',64),p_policy,now(),'synthetic-consent-v1',now(),'synthetic-signer');
$seed$;
select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001');
select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001');
select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002');

insert into storage.objects (bucket_id,name)
select video_bucket_id,video_object_path from public.dataset_contributions;
insert into storage.objects (bucket_id,name) values
('dataset-contribution-videos','10000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000099/video');
insert into storage.buckets(id,name,public) values ('dataset-test-unrelated','dataset-test-unrelated',false);
insert into storage.objects(bucket_id,name) values ('dataset-test-unrelated','unrelated-object');
-- Adversarial broad policies prove that the dataset restrictive gates still hold.
create policy dataset_test_broad_read on storage.objects for select to anon,authenticated using (true);
create policy dataset_test_broad_insert on storage.objects for insert to anon,authenticated with check (true);
create policy dataset_test_broad_update on storage.objects for update to authenticated using (true) with check (true);
create policy dataset_test_broad_delete on storage.objects for delete to authenticated using (true);


select is((select status from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 'PENDING', 'Standalone contribution starts PENDING');

select ok((select recognition_event_id is null and final_label_id is null from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 'Standalone input needs neither a prediction nor a final label');

select is((select recognition_event_id from public.dataset_contributions where id='50000000-0000-4000-8000-000000000003'), '90000000-0000-4000-8000-000000000001'::uuid, 'Unresolved optional recognition UUID is retained without a temporal table');

select throws_ok($$select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000099')$$, '23503', null, 'Contribution must reference an existing profile');

select throws_ok($$select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002')$$, '23514', null, 'Draft policy cannot attest technical validation');

select throws_ok($$select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',null,10001)$$, '23514', null, 'Technical checks use the selected policy bounds');

select throws_ok($$update public.dataset_video_policies set is_active=true where id='40000000-0000-4000-8000-000000000002'$$, '23514', null, 'An incomplete policy cannot be activated');

select throws_ok($$insert into public.dataset_curation_reviews(contribution_id,curator_id,decision,contribution_revision) values ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','APPROVED',2)$$, '23514', null, 'APPROVED audit decision requires a final label');

select throws_ok($$insert into public.dataset_curation_reviews(contribution_id,curator_id,decision,reason,contribution_revision) values ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','REJECTED','  ',2)$$, '23514', null, 'REJECTED audit decision requires a nonblank reason');

select throws_ok($$insert into public.dataset_curation_reviews(contribution_id,curator_id,decision,reason,contribution_revision) values ('50000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000001','REJECTED','test',2)$$, '23503', null, 'Orphan curation review is rejected');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from public.dataset_contributions), 2, 'User sees only their own active contributions');

select is((select count(*)::integer from public.dataset_contributions where id='50000000-0000-4000-8000-000000000002'), 0, 'A guessed contribution ID does not bypass ownership');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'), 2, 'User reads own registered videos but neither others nor orphan objects');

select throws_ok($$select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001')$$, '42501', null, 'Browser user cannot bypass trusted video ingestion');

select throws_ok($$update public.dataset_contributions set status='APPROVED',final_label_id='30000000-0000-4000-8000-000000000001' where id='50000000-0000-4000-8000-000000000001'$$, '42501', null, 'User cannot approve a contribution directly');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, '42501', null, 'User cannot approve through the curation RPC');

select throws_ok($$update public.dataset_contributions set user_id='10000000-0000-4000-8000-000000000002' where id='50000000-0000-4000-8000-000000000001'$$, '42501', null, 'User cannot transfer contribution ownership');

select throws_ok($$update public.profiles set role='admin' where user_id='10000000-0000-4000-8000-000000000001'$$, '42501', null, 'Existing profile grants prevent self-promotion to admin');

select throws_ok($$select * from private.dataset_curator_grants$$, '42501', null, 'Curator assignments are not exposed to users');

select throws_ok($$insert into private.dataset_curator_grants(user_id,granted_by,qualification_note) values ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','self')$$, '42501', null, 'User cannot assign themselves as a curator');

select throws_ok($$update public.dataset_video_policies set max_size_bytes=999999 where id='40000000-0000-4000-8000-000000000001'$$, '42501', null, 'User cannot weaken video limits');

select throws_ok($$insert into storage.objects(bucket_id,name) values ('dataset-contribution-videos','10000000-0000-4000-8000-000000000001/forged/video')$$, '42501', null, 'Broad storage policy cannot enable direct client uploads');

select lives_ok($$update storage.objects set name='tampered' where bucket_id='dataset-contribution-videos'$$, 'Direct video update is filtered by the restrictive policy');

select is((select count(*)::integer from storage.objects where name='tampered'), 0, 'A user cannot replace registered video bytes or paths through UPDATE');

select lives_ok(
  $$delete from storage.objects where bucket_id='dataset-contribution-videos'$$,
  'Direct video DELETE filters protected rows without deleting them');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'), 2, 'Direct deletion leaves the user''s registered videos intact');

select throws_ok($$select public.dataset_soft_delete_contribution('50000000-0000-4000-8000-000000000002',1)$$, '42501', null, 'User cannot soft-delete another owner''s contribution');

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}', true);

select ok(not private.is_dataset_curator(), 'A technical admin is not automatically a dataset curator');

select is((select count(*)::integer from public.dataset_contributions), 0, 'Unassigned technical admin cannot access the curation queue');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'), 0, 'Unassigned admin cannot read contribution videos');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, '42501', null, 'Unassigned admin cannot review');

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select ok(not private.is_dataset_curator(), 'A revoked assignment grants no curator capability');

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select ok(private.is_dataset_curator(), 'Explicitly assigned non-admin A is a curator');

select is((select count(*)::integer from public.dataset_contributions), 4, 'Authorized curator can read the active queue across owners');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'), 4, 'Curator can read registered active videos only');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', null, null)$$, '22023', null, 'Curator approval still requires a final label');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', '30000000-0000-4000-8000-000000000003', null)$$, '22023', null, 'Inactive label cannot be approved');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'REJECTED', null, '  ')$$, '22023', null, 'Curator rejection still requires a meaningful reason');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'PENDING', null, null)$$, '22023', null, 'PENDING is not a curation decision');

select is((select count(*)::integer from public.dataset_curation_reviews), 0, 'Invalid decisions create no audit rows');

select is((public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', '30000000-0000-4000-8000-000000000002', null) ->> 'status'), 'APPROVED', 'Curator A approves with an explicit final label');

select is((select final_label_id from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), '30000000-0000-4000-8000-000000000002'::uuid, 'Final label may differ from the contributor''s proposed label');

select is((select curator_id from public.dataset_curation_reviews where contribution_id='50000000-0000-4000-8000-000000000001'), '20000000-0000-4000-8000-000000000001'::uuid, 'Audit records the actual authenticated curator');

select is((select revision from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 2, 'Review advances the optimistic revision');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 1, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, '40001', null, 'Stale curator requests cannot overwrite a newer decision');

select is((select count(*)::integer from public.dataset_curation_reviews), 1, 'Rejected stale request creates no duplicate audit row');

select throws_ok($$update public.dataset_curation_reviews set reason='rewritten'$$, '42501', null, 'Curator cannot rewrite audit history');

select throws_ok($$delete from public.dataset_curation_reviews$$, '42501', null, 'Curator cannot remove audit history');

select throws_ok($$insert into public.dataset_curation_reviews(contribution_id,curator_id,decision,final_label_id,contribution_revision) values ('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','APPROVED','30000000-0000-4000-8000-000000000001',2)$$, '42501', null, 'Curator cannot bypass the atomic review function');

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select ok(private.is_dataset_curator(), 'A second assigned non-admin curator is independently supported');

select lives_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000002', 1, 'REJECTED', null, 'Incomplete gesture')$$, 'Curator B rejects with a reason');

select is((select rejection_reason from public.dataset_contributions where id='50000000-0000-4000-8000-000000000002'), 'Incomplete gesture', 'Rejection reason is retained on the contribution');

reset role;

select is((select count(*)::integer from public.dataset_notifications), 2, 'Decisions and owner notifications are saved atomically');

select is((select count(*)::integer from public.dataset_notifications n join public.dataset_contributions c on c.id=n.contribution_id where n.user_id<>c.user_id), 0, 'Curation notification recipient matches the contribution owner');

select throws_ok($$update public.dataset_curation_reviews set reason='operator rewrite'$$, '42501', null, 'Append-only trigger also protects against accidental privileged audit edits');

select throws_ok($$update public.dataset_contributions set current_review_id=(select current_review_id from public.dataset_contributions where id='50000000-0000-4000-8000-000000000002') where id='50000000-0000-4000-8000-000000000001'$$, '23503', null, 'Current review cannot point to another contribution');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from public.dataset_curation_reviews), 1, 'Owner sees only their own review history');

select is((select count(*)::integer from public.dataset_notifications), 1, 'Notification inbox is owner-scoped');

select lives_ok($$update public.dataset_notifications set read_at=now()$$, 'Owner may mark their own notification read');

select is((select count(*)::integer from public.dataset_notifications where read_at is not null), 1, 'Read marker is saved');

select throws_ok($$update public.dataset_notifications set payload='{}'::jsonb$$, '42501', null, 'Owner cannot rewrite notification contents');

select lives_ok($$update public.dataset_notifications set read_at=now() where user_id='10000000-0000-4000-8000-000000000002'$$, 'Updating another inbox is filtered');

reset role;

select is((select count(*)::integer from public.dataset_notifications where user_id='10000000-0000-4000-8000-000000000002' and read_at is not null), 0, 'Another owner''s read markers remain unchanged');

insert into public.dataset_exports(id,requested_by,manifest_version) values
('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','synthetic-v1'), ('60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','synthetic-v1');

select throws_ok($$insert into public.dataset_exports(requested_by,manifest_version) values ('20000000-0000-4000-8000-000000000001','test')$$, '42501', null, 'Curator cannot be recorded as an admin export requester');
select throws_ok($$insert into public.dataset_exports(requested_by,manifest_version) values ('10000000-0000-4000-8000-000000000002','test')$$, '42501', null, 'Non-admin account cannot request an export');
select throws_ok($$update public.dataset_contributions set final_label_id='30000000-0000-4000-8000-000000000001' where id='50000000-0000-4000-8000-000000000001'$$, '23503', null, 'Current final label must match the referenced approved review');
set local role service_role;
select lives_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001')$$, 'Trusted backend can capture a locked authoritative export snapshot');
reset role;
select lives_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001')$$, 'Approved contribution can be snapshotted for a future export');

select is((select final_label_id from public.dataset_export_items where export_id='60000000-0000-4000-8000-000000000001'), '30000000-0000-4000-8000-000000000002'::uuid, 'Export stores the curated label rather than the proposed label');

select is((select source_sha256 from public.dataset_export_items where export_id='60000000-0000-4000-8000-000000000001'), repeat('a',64), 'Export records the authoritative source checksum');

select throws_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001')$$, '23505', null, 'Same contribution cannot appear twice in one batch');

select throws_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002')$$, '23514', null, 'Rejected contribution cannot enter an export');

select throws_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000003')$$, '23514', null, 'Pending contribution cannot enter an export');

select throws_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000099','50000000-0000-4000-8000-000000000001')$$, '23514', null, 'Export item requires an existing queued batch');

select throws_ok($$update public.dataset_export_items set source_sha256=repeat('b',64)$$, '42501', null, 'Export snapshots cannot be rewritten');

update public.dataset_exports set processing_state='READY',archive_object_path=requested_by::text||'/'||id::text||'/archive.zip',
archive_sha256=repeat('b',64),item_count=1,total_source_bytes=1000,completed_at=now() where id='60000000-0000-4000-8000-000000000001';
insert into storage.objects(bucket_id,name)
select archive_bucket_id,archive_object_path from public.dataset_exports where id='60000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}', true);

select is((select count(*)::integer from public.dataset_exports), 1, 'Admin sees only exports they requested');

select is((select count(*)::integer from public.dataset_export_items), 1, 'Export item access follows its parent batch');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-export-archives'), 1, 'Requesting admin can read the ready archive');

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is((select count(*)::integer from storage.objects where bucket_id='dataset-export-archives'), 0, 'Another curator cannot read a private export they did not request');

select lives_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 2, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, 'A second curator can re-review with the current revision');

reset role;

select is((select count(*)::integer from public.dataset_curation_reviews where contribution_id='50000000-0000-4000-8000-000000000001'), 2, 'Re-review retains both historical decisions');

select is((select final_label_id from public.dataset_export_items where export_id='60000000-0000-4000-8000-000000000001'), '30000000-0000-4000-8000-000000000002'::uuid, 'Existing export snapshot remains tied to its original approved review');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*)::integer from storage.objects where bucket_id='dataset-export-archives'), 0, 'Re-review blocks new downloads of an outdated archive');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from storage.objects where bucket_id='dataset-test-unrelated'), 1, 'Dataset restrictive gates leave unrelated buckets unchanged');
select throws_ok($$select public.dataset_soft_delete_contribution('50000000-0000-4000-8000-000000000001',2)$$, '40001', null, 'Stale soft-delete cannot race a newer review');

select lives_ok($$select public.dataset_soft_delete_contribution('50000000-0000-4000-8000-000000000001',3)$$, 'Owner can soft-delete an approved contribution');

select lives_ok($$select public.dataset_soft_delete_contribution('50000000-0000-4000-8000-000000000001',3)$$, 'Retrying soft-delete is idempotent');

select is((select count(*)::integer from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 0, 'Soft-deleted contribution leaves the owner''s active collection');

select is((select count(*)::integer from storage.objects where name='10000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001/video'), 0, 'Soft-deleted source video is no longer readable');

reset role;

select is((select status from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 'APPROVED', 'Soft-delete does not rewrite the historical curation decision');

select ok((select deleted_at is not null from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 'Deletion is stored separately from curation status');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from public.dataset_contributions where id='50000000-0000-4000-8000-000000000001'), 0, 'Soft-deleted contribution also leaves the curator queue');

select is((select count(*)::integer from storage.objects where bucket_id='dataset-export-archives'), 0, 'Source deletion also blocks new archive reads');
select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000001', 4, 'REJECTED', null, 'test')$$, '22023', null, 'Deleted contribution cannot be re-reviewed');

reset role;

select throws_ok($$insert into public.dataset_export_items(export_id,contribution_id) values ('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001')$$, '23514', null, 'Deleted contribution cannot enter a later export');

update private.dataset_curator_grants set revoked_at=now() where user_id='20000000-0000-4000-8000-000000000002';
update public.profiles set role='user' where user_id='20000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select ok(not private.is_dataset_curator(), 'Revoking an assignment removes curator capability');

select is((select count(*)::integer from public.dataset_contributions), 0, 'Revoked curator loses cross-owner visibility immediately');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000004', 1, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, '42501', null, 'Revoked curator cannot review');
select is((select count(*)::integer from public.dataset_exports), 0, 'Revoked curator also loses access to their export records');

reset role;

set local role service_role;

select lives_ok($$select pg_temp.dataset_seed('50000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001')$$, 'Trusted backend can ingest metadata after configured validation');

select throws_ok($$update public.dataset_contributions set status='APPROVED' where id='50000000-0000-4000-8000-000000000004'$$, '42501', null, 'Even the ingestion role must not directly approve contributions');

select throws_ok($$update public.dataset_video_policies set max_duration_ms=99999 where id='40000000-0000-4000-8000-000000000001'$$, '42501', null, 'Normal backend privileges preserve policy versions');

reset role;

set local role anon;
select set_config('request.jwt.claims', '{}', true);

select throws_ok($$select * from public.dataset_contributions$$, '42501', null, 'Anonymous users have no dataset table access');

select throws_ok($$select public.dataset_review_contribution('50000000-0000-4000-8000-000000000004', 1, 'APPROVED', '30000000-0000-4000-8000-000000000001', null)$$, '42501', null, 'Anonymous users cannot execute curation RPCs');

select is((select count(*)::integer from storage.objects where bucket_id in ('dataset-contribution-videos','dataset-export-archives')), 0, 'Anonymous storage access remains blocked despite a broad permissive policy');

reset role;

select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'dataset_%' and p.prosecdef), 0, 'No privileged dataset function is exposed in the public API schema');

select * from finish();
rollback;
