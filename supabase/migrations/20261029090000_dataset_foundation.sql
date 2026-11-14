-- Dataset foundation: no temporal recognition tables, media processing, or ZIP generation.
-- Existing migrations must precede this migration. No production data is changed.
begin;

-- An admin needs a separate assignment after a competent human reviewer is arranged.
-- This is an authorization record, not automated certification of BISINDO expertise.
create table private.dataset_curator_grants (
  user_id uuid primary key references public.profiles(user_id) on delete restrict,
  granted_by uuid not null references public.profiles(user_id) on delete restrict,
  qualification_note text not null check (nullif(btrim(qualification_note), '') is not null),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz check (revoked_at is null or revoked_at >= granted_at)
);
alter table private.dataset_curator_grants enable row level security;

create function private.is_dataset_curator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.dataset_curator_grants g
    join public.profiles p on p.user_id = g.user_id
    where g.user_id = (select auth.uid()) and g.revoked_at is null and p.role = 'admin'
  );
$$;
revoke all on function private.is_dataset_curator() from public, anon, authenticated, service_role;
grant execute on function private.is_dataset_curator() to authenticated;

-- No pilot parameters or active policy are seeded. Each version is a configuration
-- snapshot. Normal backend privileges permit changing only its is_active flag.
create table public.dataset_video_policies (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (nullif(btrim(version), '') is not null),
  min_duration_ms integer check (min_duration_ms > 0),
  max_duration_ms integer check (max_duration_ms > 0),
  min_short_side_px integer check (min_short_side_px > 0),
  max_long_side_px integer check (max_long_side_px > 0),
  max_size_bytes bigint check (max_size_bytes > 0),
  allowed_mime_types text[],
  is_active boolean not null default false,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  check (max_duration_ms >= min_duration_ms),
  check (max_long_side_px >= min_short_side_px),
  check (allowed_mime_types is null or (
    cardinality(allowed_mime_types) > 0 and array_position(allowed_mime_types, null) is null
  )),
  check (not is_active or (
    approved_at is not null and min_duration_ms is not null and max_duration_ms is not null
    and min_short_side_px is not null and max_long_side_px is not null
    and max_size_bytes is not null and allowed_mime_types is not null
  ))
);
create unique index dataset_one_active_video_policy
  on public.dataset_video_policies (is_active) where is_active;

create table public.dataset_labels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null check (nullif(btrim(display_name), '') is not null),
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.dataset_labels is
  'Dataset catalog independent of model class order. AI predictions never auto-approve labels.';

create table public.dataset_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete restrict,
  recognition_event_id uuid,
  proposed_label_id uuid references public.dataset_labels(id) on delete restrict,
  proposed_label_text text,
  final_label_id uuid references public.dataset_labels(id) on delete restrict,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason text,
  current_review_id uuid,
  revision integer not null default 1 check (revision > 0),
  video_bucket_id text not null default 'dataset-contribution-videos'
    check (video_bucket_id = 'dataset-contribution-videos'),
  video_object_path text not null unique,
  size_bytes bigint not null check (size_bytes > 0),
  duration_ms integer not null check (duration_ms > 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  fps numeric check (fps > 0),
  mime_type text not null check (nullif(btrim(mime_type), '') is not null),
  container text,
  codec text,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  video_policy_id uuid not null references public.dataset_video_policies(id) on delete restrict,
  validated_at timestamptz not null,
  consent_version text not null check (nullif(btrim(consent_version), '') is not null),
  consented_at timestamptz not null,
  signer_pseudonym text not null check (nullif(btrim(signer_pseudonym), '') is not null),
  recording_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id),
  check (proposed_label_id is not null or nullif(btrim(proposed_label_text), '') is not null),
  check (video_object_path = user_id::text || '/' || id::text || '/video'),
  check (
    (status = 'PENDING' and final_label_id is null and current_review_id is null and rejection_reason is null)
    or (status = 'APPROVED' and final_label_id is not null and current_review_id is not null and rejection_reason is null)
    or (status = 'REJECTED' and final_label_id is null and current_review_id is not null
      and nullif(btrim(rejection_reason), '') is not null)
  )
);
comment on column public.dataset_contributions.recognition_event_id is
  'Optional Meiske integration contract; intentionally no FK to a future temporal recognition table. Null supports standalone contributions.';
comment on column public.dataset_contributions.validated_at is
  'Trusted ingestion attestation: metadata checks here do not replace actual server-side video decoding/validation.';

create table public.dataset_curation_reviews (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.dataset_contributions(id) on delete restrict,
  curator_id uuid not null references public.profiles(user_id) on delete restrict,
  decision text not null check (decision in ('APPROVED', 'REJECTED')),
  final_label_id uuid references public.dataset_labels(id) on delete restrict,
  reason text,
  contribution_revision integer not null check (contribution_revision > 1),
  created_at timestamptz not null default now(),
  unique (contribution_id, contribution_revision),
  unique (contribution_id, id, decision),
  unique (contribution_id, id, decision, final_label_id),
  check (
    (decision = 'APPROVED' and final_label_id is not null)
    or (decision = 'REJECTED' and final_label_id is null and nullif(btrim(reason), '') is not null)
  )
);
alter table public.dataset_contributions add constraint dataset_current_review_fk
  foreign key (id, current_review_id, status)
  references public.dataset_curation_reviews(contribution_id, id, decision) on delete restrict;

alter table public.dataset_contributions add constraint dataset_current_review_label_fk
  foreign key (id, current_review_id, status, final_label_id)
  references public.dataset_curation_reviews(contribution_id, id, decision, final_label_id) on delete restrict;

create table public.dataset_exports (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(user_id) on delete restrict,
  processing_state text not null default 'QUEUED'
    check (processing_state in ('QUEUED', 'PROCESSING', 'READY', 'FAILED')),
  archive_bucket_id text not null default 'dataset-export-archives'
    check (archive_bucket_id = 'dataset-export-archives'),
  archive_object_path text unique,
  archive_sha256 text check (archive_sha256 ~ '^[0-9a-f]{64}$'),
  manifest_version text not null check (nullif(btrim(manifest_version), '') is not null),
  item_count integer not null default 0 check (item_count >= 0),
  total_source_bytes bigint not null default 0 check (total_source_bytes >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, requested_by),
  check (archive_object_path is null or archive_object_path = requested_by::text || '/' || id::text || '/archive.zip'),
  check (processing_state <> 'READY' or (
    archive_object_path is not null and archive_sha256 is not null and completed_at is not null and item_count > 0
  )),
  check (processing_state <> 'FAILED' or nullif(btrim(error_message), '') is not null)
);

create table public.dataset_export_items (
  export_id uuid not null references public.dataset_exports(id) on delete restrict,
  contribution_id uuid not null references public.dataset_contributions(id) on delete restrict,
  review_id uuid not null,
  review_decision text not null default 'APPROVED' check (review_decision = 'APPROVED'),
  final_label_id uuid not null references public.dataset_labels(id) on delete restrict,
  contribution_revision integer not null check (contribution_revision > 1),
  source_object_path text not null,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  consent_version text not null,
  metadata_snapshot jsonb not null check (jsonb_typeof(metadata_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  primary key (export_id, contribution_id),
  foreign key (contribution_id, review_id, review_decision, final_label_id)
    references public.dataset_curation_reviews(contribution_id, id, decision, final_label_id) on delete restrict
);

create table public.dataset_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null check (kind in ('CURATION_DECISION', 'EXPORT_READY', 'EXPORT_FAILED')),
  contribution_id uuid,
  review_id uuid unique,
  review_decision text,
  export_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  read_at timestamptz check (read_at is null or read_at >= created_at),
  foreign key (contribution_id, user_id) references public.dataset_contributions(id, user_id) on delete restrict,
  foreign key (contribution_id, review_id, review_decision)
    references public.dataset_curation_reviews(contribution_id, id, decision) on delete restrict,
  foreign key (export_id, user_id) references public.dataset_exports(id, requested_by) on delete restrict,
  check (
    (kind = 'CURATION_DECISION' and contribution_id is not null and review_id is not null
      and review_decision is not null and export_id is null)
    or (kind in ('EXPORT_READY', 'EXPORT_FAILED') and export_id is not null
      and contribution_id is null and review_id is null and review_decision is null)
  )
);
create unique index dataset_export_notification_once
  on public.dataset_notifications (export_id, kind) where export_id is not null;
create index dataset_contributions_owner_created on public.dataset_contributions (user_id, created_at desc)
  where deleted_at is null;
create index dataset_contributions_queue on public.dataset_contributions (status, created_at)
  where deleted_at is null;
create index dataset_reviews_contribution on public.dataset_curation_reviews (contribution_id, created_at desc);
create index dataset_notifications_inbox on public.dataset_notifications (user_id, created_at desc);
create index dataset_exports_requester on public.dataset_exports (requested_by, created_at desc);
create index dataset_export_items_contribution on public.dataset_export_items (contribution_id);

-- Fail closed until a complete, pilot-approved policy is active. These checks
-- concern trusted metadata, not the contents of a video file.
create function private.dataset_check_ingestion()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare p public.dataset_video_policies%rowtype;
begin
  if new.status <> 'PENDING' or new.final_label_id is not null or new.current_review_id is not null
    or new.rejection_reason is not null or new.deleted_at is not null or new.revision <> 1 then
    raise exception 'Contributions must enter as active, unreviewed PENDING candidates' using errcode = '23514';
  end if;
  select * into p from public.dataset_video_policies where id = new.video_policy_id;
  if not found or not p.is_active then
    raise exception 'An active pilot-approved video policy is required' using errcode = '23514';
  end if;
  if new.size_bytes > p.max_size_bytes or new.duration_ms < p.min_duration_ms
    or new.duration_ms > p.max_duration_ms or least(new.width, new.height) < p.min_short_side_px
    or greatest(new.width, new.height) > p.max_long_side_px
    or not (new.mime_type = any(p.allowed_mime_types)) then
    raise exception 'Video metadata does not satisfy its policy' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger dataset_check_ingestion before insert on public.dataset_contributions
  for each row execute function private.dataset_check_ingestion();

create function private.dataset_audit_append_only()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise exception 'Dataset audit records are append-only' using errcode = '42501';
end;
$$;
create trigger dataset_reviews_append_only before update or delete on public.dataset_curation_reviews
  for each row execute function private.dataset_audit_append_only();
create trigger dataset_export_items_append_only before update or delete on public.dataset_export_items
  for each row execute function private.dataset_audit_append_only();

-- Authoritative export snapshots. No archive is produced at this stage.
create function private.dataset_snapshot_export_item()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare c public.dataset_contributions%rowtype;
begin
  perform 1 from public.dataset_exports where id = new.export_id and processing_state = 'QUEUED' for update;
  if not found then
    raise exception 'Export must exist and be QUEUED' using errcode = '23514';
  end if;
  select * into c from public.dataset_contributions where id = new.contribution_id for update;
  if not found or c.status <> 'APPROVED' or c.deleted_at is not null then
    raise exception 'Only active APPROVED contributions can enter an export' using errcode = '23514';
  end if;
  new.review_id := c.current_review_id;
  new.review_decision := 'APPROVED';
  new.final_label_id := c.final_label_id;
  new.contribution_revision := c.revision;
  new.source_object_path := c.video_object_path;
  new.source_sha256 := c.source_sha256;
  new.consent_version := c.consent_version;
  new.metadata_snapshot := jsonb_build_object(
    'size_bytes', c.size_bytes, 'duration_ms', c.duration_ms, 'width', c.width, 'height', c.height,
    'fps', c.fps, 'mime_type', c.mime_type, 'container', c.container, 'codec', c.codec,
    'signer_pseudonym', c.signer_pseudonym, 'recording_session_id', c.recording_session_id,
    'video_policy_id', c.video_policy_id, 'consented_at', c.consented_at,
    'approved_at', (select r.created_at from public.dataset_curation_reviews r where r.id = c.current_review_id),
    'label_code', (select l.code from public.dataset_labels l where l.id = c.final_label_id)
  );
  return new;
end;
$$;
create trigger dataset_snapshot_export_item before insert on public.dataset_export_items
  for each row execute function private.dataset_snapshot_export_item();

create function private.dataset_review_contribution(
  p_contribution_id uuid, p_expected_revision integer, p_decision text,
  p_final_label_id uuid default null, p_reason text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  c public.dataset_contributions%rowtype;
  v_review_id uuid := gen_random_uuid();
  v_reason text := nullif(btrim(p_reason), '');
begin
  if not private.is_dataset_curator() then
    raise exception 'An explicitly authorized admin curator is required' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('APPROVED', 'REJECTED') then
    raise exception 'Invalid curation decision' using errcode = '22023';
  end if;
  if p_decision = 'REJECTED' and (v_reason is null or p_final_label_id is not null) then
    raise exception 'REJECTED requires a reason and no final label' using errcode = '22023';
  end if;
  if p_decision = 'APPROVED' and not exists (
    select 1 from public.dataset_labels where id = p_final_label_id and is_active
  ) then
    raise exception 'APPROVED requires an active final label' using errcode = '22023';
  end if;
  select * into c from public.dataset_contributions where id = p_contribution_id for update;
  if not found or c.deleted_at is not null then
    raise exception 'Active contribution not found' using errcode = '22023';
  end if;
  if c.revision is distinct from p_expected_revision then
    raise exception 'Contribution revision changed' using errcode = '40001';
  end if;
  insert into public.dataset_curation_reviews
    (id, contribution_id, curator_id, decision, final_label_id, reason, contribution_revision)
  values (v_review_id, c.id, auth.uid(), p_decision, p_final_label_id, v_reason, c.revision + 1);
  update public.dataset_contributions set
    status = p_decision, final_label_id = p_final_label_id,
    rejection_reason = case when p_decision = 'REJECTED' then v_reason else null end,
    current_review_id = v_review_id, revision = c.revision + 1, updated_at = now()
  where id = c.id;
  insert into public.dataset_notifications
    (user_id, kind, contribution_id, review_id, review_decision, payload)
  values (c.user_id, 'CURATION_DECISION', c.id, v_review_id, p_decision,
    jsonb_build_object('decision', p_decision, 'final_label_id', p_final_label_id, 'reason', v_reason));
  return jsonb_build_object('contribution_id', c.id, 'review_id', v_review_id,
    'status', p_decision, 'revision', c.revision + 1);
end;
$$;

create function private.dataset_soft_delete_contribution(p_contribution_id uuid, p_expected_revision integer)
returns void language plpgsql security definer set search_path = ''
as $$
declare c public.dataset_contributions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into c from public.dataset_contributions
    where id = p_contribution_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Owned contribution not found' using errcode = '42501';
  end if;
  if c.deleted_at is not null then return; end if;
  if c.revision is distinct from p_expected_revision then
    raise exception 'Contribution revision changed' using errcode = '40001';
  end if;
  update public.dataset_contributions
    set deleted_at = now(), updated_at = now(), revision = c.revision + 1 where id = c.id;
end;
$$;

-- Existing architecture: public invoker wrappers, private checked definer functions.
create function public.dataset_review_contribution(
  p_contribution_id uuid, p_expected_revision integer, p_decision text,
  p_final_label_id uuid default null, p_reason text default null
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.dataset_review_contribution(p_contribution_id, p_expected_revision, p_decision, p_final_label_id, p_reason); $$;
create function public.dataset_soft_delete_contribution(p_contribution_id uuid, p_expected_revision integer)
returns void language sql security invoker set search_path = ''
as $$ select private.dataset_soft_delete_contribution(p_contribution_id, p_expected_revision); $$;

revoke all on function private.dataset_check_ingestion(), private.dataset_audit_append_only(),
  private.dataset_snapshot_export_item() from public, anon, authenticated, service_role;
revoke all on function private.dataset_review_contribution(uuid, integer, text, uuid, text),
  public.dataset_review_contribution(uuid, integer, text, uuid, text),
  private.dataset_soft_delete_contribution(uuid, integer), public.dataset_soft_delete_contribution(uuid, integer)
  from public, anon, authenticated, service_role;
grant execute on function private.dataset_review_contribution(uuid, integer, text, uuid, text),
  public.dataset_review_contribution(uuid, integer, text, uuid, text),
  private.dataset_soft_delete_contribution(uuid, integer), public.dataset_soft_delete_contribution(uuid, integer)
  to authenticated;

alter table public.dataset_labels enable row level security;
alter table public.dataset_video_policies enable row level security;
alter table public.dataset_contributions enable row level security;
alter table public.dataset_curation_reviews enable row level security;
alter table public.dataset_notifications enable row level security;
alter table public.dataset_exports enable row level security;
alter table public.dataset_export_items enable row level security;

-- Revoke Supabase default table grants before granting intended capabilities.
revoke all on public.dataset_labels, public.dataset_video_policies, public.dataset_contributions,
  public.dataset_curation_reviews, public.dataset_notifications, public.dataset_exports,
  public.dataset_export_items, private.dataset_curator_grants from public, anon, authenticated, service_role;
grant select on public.dataset_labels, public.dataset_video_policies, public.dataset_contributions,
  public.dataset_curation_reviews, public.dataset_notifications, public.dataset_exports,
  public.dataset_export_items to authenticated;
grant update (read_at) on public.dataset_notifications to authenticated;
grant select, insert, update on public.dataset_labels, private.dataset_curator_grants to service_role;
grant select, insert on public.dataset_video_policies, public.dataset_contributions,
  public.dataset_export_items, public.dataset_notifications to service_role;
grant update (is_active) on public.dataset_video_policies to service_role;
grant select on public.dataset_curation_reviews to service_role;
grant select, insert on public.dataset_exports to service_role;
grant update (processing_state, archive_object_path, archive_sha256, item_count,
  total_source_bytes, error_message, completed_at) on public.dataset_exports to service_role;
grant usage on schema private to service_role;

create policy dataset_labels_read on public.dataset_labels for select to authenticated using (true);
create policy dataset_video_policies_read on public.dataset_video_policies for select to authenticated using (true);
create policy dataset_contributions_read on public.dataset_contributions for select to authenticated
  using (deleted_at is null and (user_id = (select auth.uid()) or (select private.is_dataset_curator())));
create policy dataset_reviews_read on public.dataset_curation_reviews for select to authenticated
  using ((select private.is_dataset_curator()) or exists (
    select 1 from public.dataset_contributions c where c.id = contribution_id and c.user_id = (select auth.uid())
  ));
create policy dataset_notifications_read on public.dataset_notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy dataset_notifications_mark_read on public.dataset_notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dataset_exports_read on public.dataset_exports for select to authenticated
  using (requested_by = (select auth.uid()) and (select private.is_dataset_curator()));
create policy dataset_export_items_read on public.dataset_export_items for select to authenticated
  using (exists (select 1 from public.dataset_exports e where e.id = export_id));


-- Only an explicitly assigned admin may be recorded as an export requester.
create function private.dataset_check_export_requester()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.dataset_curator_grants g join public.profiles p on p.user_id = g.user_id
    where g.user_id = new.requested_by and g.revoked_at is null and p.role = 'admin'
  ) then
    raise exception 'Export requester must be an authorized admin curator' using errcode = '42501';
  end if;
  if new.processing_state <> 'QUEUED' or new.archive_object_path is not null
    or new.archive_sha256 is not null or new.completed_at is not null
    or new.item_count <> 0 or new.total_source_bytes <> 0 then
    raise exception 'Exports must start QUEUED without artifacts' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger dataset_check_export_requester before insert on public.dataset_exports
  for each row execute function private.dataset_check_export_requester();
revoke all on function private.dataset_check_export_requester() from public, anon, authenticated, service_role;

-- Gate NEW archive reads if a source was deleted or re-reviewed after its snapshot.
-- Previously issued signed URLs still require a short lifetime at the API layer.
create function private.dataset_can_download_export(p_object_path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_dataset_curator() and exists (
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
revoke all on function private.dataset_can_download_export(text) from public, anon, authenticated, service_role;
grant execute on function private.dataset_can_download_export(text) to authenticated;

-- Create private buckets; never silently alter a pre-existing bucket.
insert into storage.buckets (id, name, public)
values ('dataset-contribution-videos', 'dataset-contribution-videos', false),
       ('dataset-export-archives', 'dataset-export-archives', false)
on conflict (id) do nothing;
do $$
begin
  if exists (select 1 from storage.buckets
    where id in ('dataset-contribution-videos', 'dataset-export-archives') and public) then
    raise exception 'Dataset bucket name conflicts with an existing public bucket';
  end if;
end;
$$;

create policy dataset_storage_read on storage.objects for select to authenticated using (
  (bucket_id = 'dataset-contribution-videos' and exists (
    select 1 from public.dataset_contributions c
    where c.video_object_path = name and c.video_bucket_id = bucket_id and c.deleted_at is null
      and (c.user_id = (select auth.uid()) or (select private.is_dataset_curator()))
  )) or (bucket_id = 'dataset-export-archives' and private.dataset_can_download_export(name))
);
-- Restrictive gates defeat unrelated broad permissive policies for these buckets.
create policy dataset_storage_read_gate on storage.objects as restrictive for select to authenticated using (
  bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives')
  or (bucket_id = 'dataset-contribution-videos' and exists (
    select 1 from public.dataset_contributions c where c.video_object_path = name
      and c.deleted_at is null and (c.user_id = (select auth.uid()) or (select private.is_dataset_curator()))
  )) or (bucket_id = 'dataset-export-archives' and private.dataset_can_download_export(name))
);
create policy dataset_storage_anon_gate on storage.objects as restrictive for select to anon
  using (bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives'));
create policy dataset_storage_insert_gate on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives'));
create policy dataset_storage_update_gate on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives'))
  with check (bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives'));
create policy dataset_storage_delete_gate on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id not in ('dataset-contribution-videos', 'dataset-export-archives'));

commit;
