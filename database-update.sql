-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- (Only needed if you already ran database-setup.sql before the catalogue link was added.)

-- ---------------------------------------------------------------------------
-- BOOK CATALOGUE LINK: lets anyone with the catalogue.html link VIEW the
-- catalogue (read-only). Only catalogue rows are visible; books, bills, letters
-- and everything else stay private to signed-in staff. Safe to run again.
-- ---------------------------------------------------------------------------
drop policy if exists "public catalogue read" on public.records;
create policy "public catalogue read" on public.records for select to anon
  using (kind = 'catbook' or (kind = 'set' and id in ('catmeta','catbg')));
grant select on public.records to anon;
