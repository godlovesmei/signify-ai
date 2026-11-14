-- Realtime uses existing SELECT/RLS permissions; no public video access is added.
begin;
do $$
begin
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='dataset_contributions') then
    alter publication supabase_realtime add table public.dataset_contributions;
  end if;
end; $$;
commit;
