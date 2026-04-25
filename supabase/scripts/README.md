# Supabase setup scripts

Two ways to create the 3 demo auth users and align them with the seeded data. Pick one.

## Option A — fully automated (Node)

```bash
cd supabase/scripts
npm install                   # one-time
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
DEMO_PASSWORD=demopass123 \
node seed-auth.mjs
```

Then paste `align-auth-users.sql` into the Supabase SQL Editor and **Run**.

## Option B — dashboard + SQL

1. Authentication → Users → **Add user** three times:
   - `qa.lead@vo360.demo`
   - `auditor1@vo360.demo`
   - `auditor2@vo360.demo`
   (Pick any password; remember it for login.)
2. SQL Editor → paste `align-auth-users.sql` → **Run**.

## What `align-auth-users.sql` does

The seed inserts `public.users` with placeholder UUIDs and wires audits to them. When Supabase Auth creates the real users it assigns fresh UUIDs. The script swaps every reference over inside a single transaction with FK checks deferred. Idempotent — safe to re-run.

It prints two verification queries at the end. After running you should see:

- `users aligned` — three rows with the demo emails
- `audits aligned` — three rows with `auditor1` / `auditor2` in the `auditor` column
