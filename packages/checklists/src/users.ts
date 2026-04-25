import type { User } from '@vo360/shared';

/**
 * Demo users — emails are used to seed Supabase Auth in a separate step
 * (see supabase/seed-auth.md). Passwords managed out-of-band.
 */
export const DEMO_USERS: User[] = [
  {
    id: 'bbbb2222-0000-0000-0000-000000000001',
    email: 'qa.lead@vo360.demo',
    name: 'Priya Sharma (QA Lead)',
    role: 'admin',
  },
  {
    id: 'bbbb2222-0000-0000-0000-000000000002',
    email: 'auditor1@vo360.demo',
    name: 'Ramesh Kumar',
    role: 'auditor',
  },
  {
    id: 'bbbb2222-0000-0000-0000-000000000003',
    email: 'auditor2@vo360.demo',
    name: 'Lakshmi Iyer',
    role: 'auditor',
  },
];
