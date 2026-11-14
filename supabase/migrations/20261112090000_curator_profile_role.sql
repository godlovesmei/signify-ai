-- Assign reviewers by auth.users UUID in Supabase, without an application admin.
begin;
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin', 'curator'));
-- Preserve existing active reviewer assignments.
update public.profiles p set role='curator' where p.role='user' and exists (
  select 1 from private.dataset_curator_grants g where g.user_id=p.user_id and g.revoked_at is null);
create or replace function private.is_dataset_curator()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles where user_id=auth.uid() and role='curator'); $$;
create or replace function private.dataset_access_info()
returns jsonb language sql stable security definer set search_path=''
as $$ select jsonb_build_object('is_admin',private.is_dataset_admin(),
  'is_curator',private.is_dataset_curator(),
  'review_available',exists(select 1 from public.profiles where role='curator')); $$;
-- Role changes are operator-only. Preserve historical grants and audit events.
revoke execute on function public.dataset_list_curators(), private.dataset_list_curators(),
  public.dataset_grant_curator(text,text), private.dataset_grant_curator(text,text),
  public.dataset_revoke_curator(uuid,timestamptz), private.dataset_revoke_curator(uuid,timestamptz)
  from public, anon, authenticated, service_role;
revoke insert, update on public.profiles from public, anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
notify pgrst,'reload schema';
commit;
