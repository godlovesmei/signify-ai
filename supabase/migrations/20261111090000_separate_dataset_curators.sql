-- Admins manage access and exports; explicitly assigned non-admins curate.
-- No account, administrator role, curator grant, label, or policy is seeded.
begin;

-- Profiles are created by the existing Auth trigger. Browser profile edits must
-- never turn the database role into a user-controlled authorization claim.
revoke insert, update on public.profiles from public, anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create function private.is_dataset_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where user_id=auth.uid() and role='admin'); $$;
revoke all on function private.is_dataset_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_dataset_admin() to authenticated;

create or replace function private.is_dataset_curator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from private.dataset_curator_grants g
    join public.profiles p on p.user_id=g.user_id
    where g.user_id=auth.uid() and g.revoked_at is null and p.role='user');
$$;

create table private.dataset_curator_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete restrict,
  actor_id uuid not null references public.profiles(user_id) on delete restrict,
  action text not null check(action in ('GRANTED','REVOKED')),
  qualification_note text not null,
  created_at timestamptz not null default now()
);
alter table private.dataset_curator_access_events enable row level security;
revoke all on private.dataset_curator_access_events from public,anon,authenticated,service_role;
create trigger dataset_curator_events_append_only before update or delete on private.dataset_curator_access_events
  for each row execute function private.dataset_audit_append_only();

create function private.dataset_access_info()
returns jsonb language sql stable security definer set search_path = ''
as $$ select jsonb_build_object('is_admin',private.is_dataset_admin(),
  'is_curator',private.is_dataset_curator(), 'review_available',exists(
    select 1 from private.dataset_curator_grants g join public.profiles p on p.user_id=g.user_id
    where g.revoked_at is null and p.role='user')); $$;

create function private.dataset_list_curators()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_dataset_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('user_id',g.user_id,'email',u.email,
    'display_name',p.display_name,'qualification_note',g.qualification_note,'granted_at',g.granted_at,
    'revoked_at',g.revoked_at) order by g.granted_at desc)
    from private.dataset_curator_grants g join public.profiles p on p.user_id=g.user_id
    join auth.users u on u.id=g.user_id where p.role='user'), '[]'::jsonb);
end; $$;

create function private.dataset_grant_curator(p_email text,p_qualification_note text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user uuid; v_role text; v_existing private.dataset_curator_grants%rowtype;
begin
  if not private.is_dataset_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  if nullif(btrim(p_email),'') is null or length(p_email)>254
    or nullif(btrim(p_qualification_note),'') is null or length(p_qualification_note)>2000 then
    raise exception 'Email and qualification note required' using errcode='22023'; end if;
  select p.user_id,p.role into v_user,v_role from public.profiles p join auth.users u on u.id=p.user_id
    where lower(u.email)=lower(btrim(p_email));
  if v_user is null or v_role<>'user' then
    raise exception 'Existing non-admin account required' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select * into v_existing from private.dataset_curator_grants where user_id=v_user for update;
  if found and v_existing.revoked_at is null then
    raise exception 'Curator already active' using errcode='23505'; end if;
  insert into private.dataset_curator_grants(user_id,granted_by,qualification_note)
    values(v_user,auth.uid(),btrim(p_qualification_note)) on conflict(user_id) do update set
      granted_by=excluded.granted_by,qualification_note=excluded.qualification_note,
      granted_at=clock_timestamp(),revoked_at=null;
  insert into private.dataset_curator_access_events(user_id,actor_id,action,qualification_note)
    values(v_user,auth.uid(),'GRANTED',btrim(p_qualification_note));
  return jsonb_build_object('user_id',v_user,'active',true);
end; $$;

create function private.dataset_revoke_curator(p_user_id uuid,p_expected_granted_at timestamptz)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare g private.dataset_curator_grants%rowtype;
begin
  if not private.is_dataset_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select * into g from private.dataset_curator_grants where user_id=p_user_id for update;
  if not found or g.granted_at is distinct from p_expected_granted_at then
    raise exception 'Curator access changed' using errcode='40001'; end if;
  if g.revoked_at is null then
    update private.dataset_curator_grants set revoked_at=clock_timestamp() where user_id=p_user_id;
    insert into private.dataset_curator_access_events(user_id,actor_id,action,qualification_note)
      values(p_user_id,auth.uid(),'REVOKED',g.qualification_note);
  end if;
  return jsonb_build_object('user_id',p_user_id,'active',false);
end; $$;

-- An explicit approval may resolve a proposed new word to a catalog label.
-- Label creation and the existing review/audit/notification RPC share one transaction.
create function private.dataset_review_contribution(
  p_contribution_id uuid,p_expected_revision integer,p_decision text,
  p_final_label_id uuid,p_reason text,p_final_label_text text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_label uuid := p_final_label_id; v_text text := nullif(btrim(p_final_label_text),'');
begin
  if not private.is_dataset_curator() then raise exception 'Curator required' using errcode='42501'; end if;
  if v_text is not null then
    if p_decision<>'APPROVED' or p_final_label_id is not null or length(v_text)>160 then
      raise exception 'Invalid final label' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended(lower(v_text),1));
    select id into v_label from public.dataset_labels where is_active and lower(btrim(display_name))=lower(v_text)
      order by created_at,id limit 1;
    if v_label is null then
      insert into public.dataset_labels(code,display_name,created_by)
        values('word_'||replace(gen_random_uuid()::text,'-',''),v_text,auth.uid()) returning id into v_label;
    end if;
  end if;
  return private.dataset_review_contribution(p_contribution_id,p_expected_revision,p_decision,v_label,p_reason);
end; $$;

create function public.dataset_access_info() returns jsonb language sql stable security invoker set search_path=''
as $$ select private.dataset_access_info(); $$;
create function public.dataset_list_curators() returns jsonb language sql stable security invoker set search_path=''
as $$ select private.dataset_list_curators(); $$;
create function public.dataset_grant_curator(p_email text,p_qualification_note text)
returns jsonb language sql security invoker set search_path=''
as $$ select private.dataset_grant_curator(p_email,p_qualification_note); $$;
create function public.dataset_revoke_curator(p_user_id uuid,p_expected_granted_at timestamptz)
returns jsonb language sql security invoker set search_path=''
as $$ select private.dataset_revoke_curator(p_user_id,p_expected_granted_at); $$;
create function public.dataset_review_contribution(p_contribution_id uuid,p_expected_revision integer,p_decision text,
  p_final_label_id uuid,p_reason text,p_final_label_text text)
returns jsonb language sql security invoker set search_path=''
as $$ select private.dataset_review_contribution(p_contribution_id,p_expected_revision,p_decision,p_final_label_id,p_reason,p_final_label_text); $$;

revoke all on function private.dataset_access_info(),public.dataset_access_info(),
  private.dataset_list_curators(),public.dataset_list_curators(),
  private.dataset_grant_curator(text,text),public.dataset_grant_curator(text,text),
  private.dataset_revoke_curator(uuid,timestamptz),public.dataset_revoke_curator(uuid,timestamptz),
  private.dataset_review_contribution(uuid,integer,text,uuid,text,text),
  public.dataset_review_contribution(uuid,integer,text,uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function private.dataset_access_info(),public.dataset_access_info(),
  private.dataset_list_curators(),public.dataset_list_curators(),
  private.dataset_grant_curator(text,text),public.dataset_grant_curator(text,text),
  private.dataset_revoke_curator(uuid,timestamptz),public.dataset_revoke_curator(uuid,timestamptz),
  private.dataset_review_contribution(uuid,integer,text,uuid,text,text),
  public.dataset_review_contribution(uuid,integer,text,uuid,text,text) to authenticated;

-- Export authorization is independent of reviewer membership.
drop policy dataset_exports_read on public.dataset_exports;
create policy dataset_exports_read on public.dataset_exports for select to authenticated
  using(requested_by=auth.uid() and private.is_dataset_admin());
create or replace function private.dataset_check_export_requester()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
  if not exists(select 1 from public.profiles where user_id=new.requested_by and role='admin') then
    raise exception 'Export requester must be an administrator' using errcode='42501'; end if;
  if new.processing_state<>'QUEUED' or new.archive_object_path is not null or new.archive_sha256 is not null
    or new.completed_at is not null or new.item_count<>0 or new.total_source_bytes<>0 then
    raise exception 'Exports must start QUEUED without artifacts' using errcode='23514'; end if;
  return new;
end; $$;
create or replace function private.dataset_can_download_export(p_object_path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_dataset_admin() and exists (
    select 1 from public.dataset_exports e
    where e.archive_object_path = p_object_path and e.requested_by = (select auth.uid())
      and e.processing_state = 'READY' and e.item_count > 0
      and e.item_count = (select count(*) from public.dataset_export_items i where i.export_id = e.id)
      and not exists (
        select 1 from public.dataset_export_items i
        join public.dataset_contributions c on c.id = i.contribution_id
        where i.export_id = e.id and (
          c.deleted_at is not null or c.status <> 'APPROVED'
          or c.current_review_id is distinct from i.review_id
          or c.final_label_id is distinct from i.final_label_id
          or c.source_sha256 is distinct from i.source_sha256
          or c.consent_version is distinct from i.consent_version
        )
      )
  );
$$;

notify pgrst,'reload schema';
commit;
