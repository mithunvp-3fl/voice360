-- Align seeded public.users + audits with the real auth.users UUIDs.
--
-- Why this exists:
--   The seed inserts public.users with placeholder UUIDs (bbbb2222-...) and
--   wires the seeded audits to those. When you create the real demo auth
--   users via the dashboard or admin API, Supabase assigns fresh UUIDs.
--   This script swaps every reference over in one atomic transaction.
--
-- Prerequisite: you have already created these 3 auth users in
--   Authentication → Users (or via supabase/scripts/seed-auth.mjs):
--     qa.lead@vo360.demo
--     auditor1@vo360.demo
--     auditor2@vo360.demo
--
-- Run: paste this whole file into the Supabase SQL Editor → Run.
-- Idempotent: safe to re-run; does nothing if everything already aligns.

begin;

-- Bypass FK checks for the cross-table primary-key swap. The Supabase
-- SQL Editor and the postgres role both have privileges for this.
set local session_replication_role = 'replica';

-- Snapshot the old → new mapping BEFORE we mutate anything.
create temp table _user_id_swap on commit drop as
select u.id  as old_id,
       a.id  as new_id,
       u.email
from public.users u
join auth.users  a on a.email = u.email
where u.id <> a.id;

-- 1. Repoint public.users.id.
update public.users u
set id = s.new_id
from _user_id_swap s
where u.id = s.old_id;

-- 2. Repoint audits.auditor_id.
update public.audits aud
set auditor_id = s.new_id
from _user_id_swap s
where aud.auditor_id = s.old_id;

-- (Add more child tables here as they grow — same pattern.)

commit;

-- ============================================================
-- Verification
-- ============================================================
select 'users aligned' as check, id, email, role
from public.users
where email like '%@vo360.demo'
order by email;

select 'audits aligned' as check, a.id as audit_id, u.email as auditor, a.status
from public.audits a
join public.users u on u.id = a.auditor_id
order by a.scheduled_at;
