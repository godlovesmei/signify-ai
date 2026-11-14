-- User-approved recording range. Preserve historical policies/contributions.
begin;
do $$
declare previous public.dataset_video_policies%rowtype;
begin
  select * into previous from public.dataset_video_policies where is_active for update;
  if found and (previous.min_duration_ms <> 3000 or previous.max_duration_ms <> 7000) then
    update public.dataset_video_policies set is_active=false where id=previous.id;
    insert into public.dataset_video_policies(version,min_duration_ms,max_duration_ms,
      min_short_side_px,max_long_side_px,max_size_bytes,allowed_mime_types,is_active,created_by,approved_at)
    values(previous.version||'-3-7s-20261112',3000,7000,previous.min_short_side_px,
      previous.max_long_side_px,previous.max_size_bytes,previous.allowed_mime_types,true,previous.created_by,now());
  end if;
end; $$;
alter table public.dataset_video_policies add constraint dataset_active_duration_3_7
  check (not is_active or (min_duration_ms=3000 and max_duration_ms=7000));
notify pgrst,'reload schema';
commit;
