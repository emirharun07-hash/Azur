-- AZUR Termine: einmalige Einrichtung der eigenen Cloud (Supabase → SQL Editor → Run).
-- Es ist dieselbe Tabelle wie beim Kampagnen Board. Ist das Kampagnen Board schon eingerichtet, ist hier nichts zu tun.
-- Die Termine liegen dort in den Zeilen mit parent = 'azur-termine'.

create table if not exists public.kb_docs (
  path text primary key,
  parent text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists kb_docs_parent on public.kb_docs (parent);
alter table public.kb_docs replica identity full;

alter table public.kb_docs enable row level security;
drop policy if exists "kb_docs team" on public.kb_docs;
create policy "kb_docs team" on public.kb_docs for all to anon, authenticated using (true) with check (true);

-- Live-Änderungen einschalten
do $$ begin
  alter publication supabase_realtime add table public.kb_docs;
exception when duplicate_object then null; end $$;
