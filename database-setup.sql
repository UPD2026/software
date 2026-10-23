-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.records (
  kind       text  not null,            -- 'book' | 'sale' | 'move' | 'set'
  id         text  not null,            -- ISBN / bill time / entry id / setting name
  data       jsonb not null,            -- the full record
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);

create table if not exists public.counters (
  name  text primary key,               -- 'INV' | 'IN' | 'OUT'
  value int  not null default 1         -- NEXT number to hand out
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
  for each row execute function public.touch_updated_at();

-- Safe invoice / entry numbers: two laptops can never receive the same number.
create or replace function public.take_number(p_name text) returns int
language plpgsql as $$
declare n int;
begin
  insert into public.counters(name, value) values (p_name, 2)
  on conflict (name) do update set value = public.counters.value + 1
  returning value - 1 into n;
  return n;
end $$;

create or replace function public.set_number(p_name text, p_value int) returns void
language sql as $$
  insert into public.counters(name, value) values (p_name, p_value)
  on conflict (name) do update set value = excluded.value;
$$;

-- Only logged-in staff can read or write.
alter table public.records  enable row level security;
alter table public.counters enable row level security;
drop policy if exists "staff all" on public.records;
drop policy if exists "staff all" on public.counters;
create policy "staff all" on public.records  for all to authenticated using (true) with check (true);
create policy "staff all" on public.counters for all to authenticated using (true) with check (true);

revoke all on public.records, public.counters from anon;
grant select, insert, update, delete on public.records, public.counters to authenticated;
grant execute on function public.take_number(text), public.set_number(text, int) to authenticated;

-- Live updates between laptops.
alter publication supabase_realtime add table public.records, public.counters;

-- ---------------------------------------------------------------------------
-- BOOK CATALOGUE LINK: lets anyone with the catalogue.html link VIEW the
-- catalogue (read-only). Only catalogue rows are visible; books, bills, letters
-- and everything else stay private to signed-in staff. Safe to run again.
-- ---------------------------------------------------------------------------
drop policy if exists "public catalogue read" on public.records;
create policy "public catalogue read" on public.records for select to anon
  using (kind = 'catbook' or (kind = 'set' and id in ('catmeta','catbg')));
grant select on public.records to anon;
