begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
('77000000-0000-4000-8000-000000000001','access-admin@example.test','{}'),
('77000000-0000-4000-8000-000000000002','access-curator@example.test','{}'),
('77000000-0000-4000-8000-000000000003','access-user@example.test','{"role":"admin"}');
update public.profiles set role='admin' where user_id='77000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select ok(not private.is_dataset_admin(),'User metadata does not create an administrator');
select ok(not private.is_dataset_curator(),'Ordinary user is not a curator');
select throws_ok($$update public.profiles set role='admin' where user_id=auth.uid()$$,'42501',null,'User cannot promote their database role');
select throws_ok($$select public.dataset_list_curators()$$,'42501',null,'User cannot list curator account emails');
select throws_ok($$select public.dataset_grant_curator('access-user@example.test','Self assignment')$$,'42501',null,'User cannot assign curator access');
select throws_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',now())$$,'42501',null,'User cannot revoke curator access');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select ok(private.is_dataset_admin(),'Existing database administrator is recognized');
select ok(not private.is_dataset_curator(),'Administrator is not implicitly a curator');
select throws_ok($$select public.dataset_grant_curator('missing@example.test','Competence verified')$$,'22023',null,'Unregistered account cannot receive access');
select throws_ok($$select public.dataset_grant_curator('access-admin@example.test','Competence verified')$$,'22023',null,'Admin and curator accounts remain separate');
select throws_ok($$select public.dataset_grant_curator('access-curator@example.test','  ')$$,'22023',null,'Assignment requires a competence note');
select lives_ok($$select public.dataset_grant_curator(' ACCESS-CURATOR@example.test ','Sign language reviewer assignment')$$,'Admin assigns registered non-admin account');
select is(jsonb_array_length(public.dataset_list_curators()),1,'Admin can view assigned account');
select throws_ok($$select public.dataset_grant_curator('access-curator@example.test','Duplicate')$$,'23505',null,'Repeated assignment is rejected');
select set_config('test.original_grant',(public.dataset_list_curators()->0->>'granted_at'),true);
reset role;
select is((select role from public.profiles where user_id='77000000-0000-4000-8000-000000000002'),'user','Curator assignment does not grant administrator privileges');
select is((select count(*)::integer from private.dataset_curator_access_events),1,'Assignment is audited exactly once');

insert into public.dataset_labels(id,code,display_name) values('77000000-0000-4000-8000-000000000010','existing_word','Existing word');
insert into public.dataset_video_policies(id,version,min_duration_ms,max_duration_ms,min_short_side_px,max_long_side_px,max_size_bytes,allowed_mime_types,is_active,created_by,approved_at)
values('77000000-0000-4000-8000-000000000020','curator-role-fixture',100,9000,100,1000,10000,array['video/webm'],true,'77000000-0000-4000-8000-000000000001',now());
insert into public.dataset_contributions(id,user_id,proposed_label_text,video_object_path,size_bytes,duration_ms,width,height,mime_type,source_sha256,video_policy_id,validated_at,consent_version,consented_at,signer_pseudonym)
values('77000000-0000-4000-8000-000000000030','77000000-0000-4000-8000-000000000003','New reviewed word','77000000-0000-4000-8000-000000000003/77000000-0000-4000-8000-000000000030/video',1000,1000,120,160,'video/webm',repeat('a',64),'77000000-0000-4000-8000-000000000020',now(),'fixture-consent',now(),'fixture-signer');
insert into storage.objects(bucket_id,name) select video_bucket_id,video_object_path from public.dataset_contributions;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(private.is_dataset_curator(),'Assigned non-admin is a curator');
select ok(not private.is_dataset_admin(),'Curator is not an administrator');
select is((public.dataset_access_info()->>'is_curator')::boolean,true,'Access RPC reads the authoritative grant');
select is((public.dataset_access_info()->>'review_available')::boolean,true,'An assigned curator makes human review available');
select is((select count(*)::integer from public.dataset_contributions),1,'Curator sees cross-owner candidates');
select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'),1,'Curator can request registered private videos');
select throws_ok($$select public.dataset_list_curators()$$,'42501',null,'Curator cannot list access management data');
select throws_ok($$select public.dataset_grant_curator('access-user@example.test','Privilege escalation')$$,'42501',null,'Curator cannot assign another curator');
select throws_ok($$insert into public.dataset_exports(requested_by,manifest_version) values(auth.uid(),'fixture')$$,'42501',null,'Curator cannot request admin exports directly');
select is((public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',1,'APPROVED',null,null,'New reviewed word')->>'status'),'APPROVED','Explicit approval creates a new final label and decision atomically');
select is((select count(*)::integer from public.dataset_labels where display_name='New reviewed word'),1,'The new reviewed word is added once to the dataset catalog');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',1,'APPROVED',null,null,'Must roll back')$$,'40001',null,'Stale approval cannot replace another decision');
select is((select count(*)::integer from public.dataset_labels where display_name='Must roll back'),0,'Failed review rolls back new label creation');
reset role;
select is((select count(*)::integer from public.dataset_curation_reviews),1,'One successful decision creates one immutable review');
select is((select count(*)::integer from public.dataset_notifications),1,'Contributor receives one decision notification');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*)::integer from public.dataset_contributions),0,'Admin has no implicit access to cross-owner raw videos');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',2,'REJECTED',null,'Admin attempt')$$,'42501',null,'Administrator cannot make curator decisions');
select lives_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',current_setting('test.original_grant')::timestamptz)$$,'Admin revokes curator access');
select lives_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',current_setting('test.original_grant')::timestamptz)$$,'Repeated revocation is idempotent');
reset role;
select is((select count(*)::integer from private.dataset_curator_access_events),2,'Repeated revocation creates no duplicate access event');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(not private.is_dataset_curator(),'Revoked curator loses their role without signing out');
select is((select count(*)::integer from public.dataset_contributions),0,'Revocation removes cross-owner candidate access');
select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'),0,'Revocation prevents new private-video access');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',2,'REJECTED',null,'Revoked attempt')$$,'42501',null,'Revoked curator cannot save another decision');
reset role;
select is((select count(*)::integer from public.dataset_curation_reviews),1,'Revocation retains decision history');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.dataset_grant_curator('access-curator@example.test','New assignment')$$,'Admin can reassign a previously revoked curator');
select throws_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',current_setting('test.original_grant')::timestamptz)$$,'40001',null,'Stale admin page cannot revoke a newer assignment');
reset role;
select is((select count(*)::integer from private.dataset_curator_access_events),3,'Reassignment has a separate audit event');
select throws_ok($$update private.dataset_curator_access_events set qualification_note='Rewritten'$$,'42501',null,'Access audit history is append-only');
select * from finish();
rollback;
