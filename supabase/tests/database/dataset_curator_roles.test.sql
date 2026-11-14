begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
('77000000-0000-4000-8000-000000000001','access-admin@example.test','{}'),
('77000000-0000-4000-8000-000000000002','access-curator@example.test','{}'),
('77000000-0000-4000-8000-000000000003','access-user@example.test','{"role":"admin"}');
update public.profiles set role='admin' where user_id='77000000-0000-4000-8000-000000000001';

-- Historical grants remain auditable, but only an operator-managed profile role
-- authorizes curators after 20261112090000_curator_profile_role.sql.
insert into private.dataset_curator_grants(user_id,granted_by,qualification_note)
values('77000000-0000-4000-8000-000000000002','77000000-0000-4000-8000-000000000001','Historical assignment');
insert into private.dataset_curator_access_events(user_id,actor_id,action,qualification_note)
values('77000000-0000-4000-8000-000000000002','77000000-0000-4000-8000-000000000001','GRANTED','Historical assignment');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select ok(not private.is_dataset_admin(),'User metadata does not create an administrator');
select ok(not private.is_dataset_curator(),'Ordinary user is not a curator');
select throws_ok($$update public.profiles set role='admin' where user_id=auth.uid()$$,'42501',null,'User cannot promote their database role');
select throws_ok($$select public.dataset_list_curators()$$,'42501',null,'User cannot list curator account emails');
select throws_ok($$select public.dataset_grant_curator('access-user@example.test','Self assignment')$$,'42501',null,'User cannot assign curator access');
select throws_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',now())$$,'42501',null,'User cannot revoke curator access');
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select ok(private.is_dataset_admin(),'Existing database administrator is recognized');
select ok(not private.is_dataset_curator(),'Administrator is not implicitly a curator');
select throws_ok($$select public.dataset_list_curators()$$,'42501',null,'Legacy list RPC is disabled for administrators');
select throws_ok($$select public.dataset_grant_curator('access-curator@example.test','Assignment')$$,'42501',null,'Legacy grant RPC is disabled for administrators');
select throws_ok($$select public.dataset_revoke_curator('77000000-0000-4000-8000-000000000002',now())$$,'42501',null,'Legacy revoke RPC is disabled for administrators');
select throws_ok($$select private.dataset_grant_curator('access-curator@example.test','Assignment')$$,'42501',null,'Private legacy grant RPC is also disabled');
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(not private.is_dataset_curator(),'A historical active grant cannot authorize a user profile');
reset role;
update public.profiles set role='curator' where user_id='77000000-0000-4000-8000-000000000002';

insert into public.dataset_video_policies(id,version,min_duration_ms,max_duration_ms,min_short_side_px,max_long_side_px,max_size_bytes,allowed_mime_types,is_active,created_by,approved_at)
values('77000000-0000-4000-8000-000000000020','curator-role-fixture',3000,7000,100,1000,10000,array['video/webm'],true,'77000000-0000-4000-8000-000000000001',now());
insert into public.dataset_contributions(id,user_id,proposed_label_text,video_object_path,size_bytes,duration_ms,width,height,mime_type,source_sha256,video_policy_id,validated_at,consent_version,consented_at,signer_pseudonym)
values('77000000-0000-4000-8000-000000000030','77000000-0000-4000-8000-000000000003','New reviewed word','77000000-0000-4000-8000-000000000003/77000000-0000-4000-8000-000000000030/video',1000,4000,120,160,'video/webm',repeat('a',64),'77000000-0000-4000-8000-000000000020',now(),'fixture-consent',now(),'fixture-signer');
insert into storage.objects(bucket_id,name) select video_bucket_id,video_object_path from public.dataset_contributions;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(private.is_dataset_curator(),'Operator-assigned profile is a curator');
select ok(not private.is_dataset_admin(),'Curator is not an administrator');
select is((public.dataset_access_info()->>'is_curator')::boolean,true,'Access RPC reads the authoritative profile role');
select is((public.dataset_access_info()->>'review_available')::boolean,true,'A profile curator makes human review available');
select is((select count(*)::integer from public.dataset_contributions),1,'Curator sees cross-owner candidates');
select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'),1,'Curator can request registered private videos');
select throws_ok($$select public.dataset_list_curators()$$,'42501',null,'Curator cannot list access management data');
select throws_ok($$select public.dataset_grant_curator('access-user@example.test','Privilege escalation')$$,'42501',null,'Curator cannot assign another curator');
select throws_ok($$insert into public.dataset_exports(requested_by,manifest_version) values(auth.uid(),'fixture')$$,'42501',null,'Curator cannot request admin exports directly');
select is((public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',1,'APPROVED',null,null,'New reviewed word')->>'status'),'APPROVED','Explicit approval creates a new final label and decision atomically');
select is((select count(*)::integer from public.dataset_labels where display_name='New reviewed word'),1,'The new reviewed word is added once to the dataset catalog');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',1,'APPROVED',null,null,'Must roll back')$$,'40001',null,'Stale approval cannot replace another decision');
select is((select count(*)::integer from public.dataset_labels where display_name='Must roll back'),0,'Failed review rolls back new label creation');
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*)::integer from public.dataset_contributions),0,'Admin has no implicit access to cross-owner raw videos');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',2,'REJECTED',null,'Admin attempt')$$,'42501',null,'Administrator cannot make curator decisions');
reset role;
select is((select count(*)::integer from public.dataset_curation_reviews),1,'One successful decision creates one immutable review');
select is((select count(*)::integer from public.dataset_notifications),1,'Contributor receives one decision notification');

update public.profiles set role='user' where user_id='77000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select ok(not private.is_dataset_curator(),'Profile revocation takes effect despite a historical active grant');
select is((select count(*)::integer from public.dataset_contributions),0,'Revocation removes cross-owner candidate access');
select is((select count(*)::integer from storage.objects where bucket_id='dataset-contribution-videos'),0,'Revocation prevents new private-video access');
select throws_ok($$select public.dataset_review_contribution('77000000-0000-4000-8000-000000000030',2,'REJECTED',null,'Revoked attempt')$$,'42501',null,'Revoked curator cannot save another decision');
reset role;
select is((select count(*)::integer from public.dataset_curation_reviews),1,'Revocation retains decision history');
select is((select count(*)::integer from private.dataset_curator_access_events),1,'Profile changes preserve historical access events');
select throws_ok($$update private.dataset_curator_access_events set qualification_note='Rewritten'$$,'42501',null,'Access audit history is append-only');
select * from finish();
rollback;
