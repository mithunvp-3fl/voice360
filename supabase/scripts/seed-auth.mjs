#!/usr/bin/env node
/**
 * Create the 3 demo auth users via the Supabase admin API.
 *
 * Idempotent: re-running prints "↻ already exists" and continues.
 * After this completes, run align-auth-users.sql in the SQL Editor to
 * point public.users + public.audits at the new UUIDs.
 *
 * Usage:
 *   cd supabase/scripts
 *   npm install
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   DEMO_PASSWORD=changeme \
 *   node seed-auth.mjs
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'demopass123';

if (!URL || !SERVICE_ROLE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const sb = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });

const USERS = [
  { email: 'qa.lead@vo360.demo',   name: 'Priya Sharma (QA Lead)', role: 'admin'   },
  { email: 'auditor1@vo360.demo',  name: 'Ramesh Kumar',           role: 'auditor' },
  { email: 'auditor2@vo360.demo',  name: 'Lakshmi Iyer',           role: 'auditor' },
];

console.log(`Creating ${USERS.length} auth users (password: ${DEMO_PASSWORD})...\n`);

let created = 0;
let existed = 0;

for (const u of USERS) {
  const { data, error } = await sb.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: u.name, role: u.role },
  });

  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      existed++;
      console.log(`  ↻ ${u.email} (already exists)`);
      continue;
    }
    console.error(`  ✗ ${u.email} — ${error.message}`);
    process.exit(1);
  }

  created++;
  console.log(`  ✓ ${u.email} → ${data.user.id}`);
}

console.log(`\nCreated ${created}, already existed ${existed}.`);
console.log('\nNext: paste supabase/scripts/align-auth-users.sql into the SQL Editor and Run.');
