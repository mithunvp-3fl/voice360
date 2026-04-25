-- Voice-Driven Audit App — initial schema
-- See audit-app-poc-plan.md §8 for the data model.

create extension if not exists "uuid-ossp";

create type user_role as enum ('admin', 'auditor');
create type audit_status as enum ('scheduled', 'in_progress', 'draft', 'submitted');
create type verdict as enum ('majorly_comply', 'partial_comply', 'not_complied', 'na');
create type response_source as enum ('tap', 'voice');

-- Mirrors auth.users; populated via trigger on signup or seeded by hand.
create table public.users (
  id uuid primary key,
  email text unique not null,
  name text not null,
  role user_role not null default 'auditor',
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  address text,
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table public.checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.checklist_sections (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  name text not null,
  display_order int not null
);

create table public.checklist_questions (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid not null references public.checklist_sections(id) on delete cascade,
  text text not null,
  is_mandatory boolean not null default true,
  response_options jsonb not null default '["majorly_comply","partial_comply","not_complied","na"]'::jsonb,
  display_order int not null
);

create table public.audits (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendors(id),
  template_id uuid not null references public.checklist_templates(id),
  -- Frozen template at audit start; admin edits to template do not affect in-progress audits.
  template_snapshot jsonb not null,
  auditor_id uuid not null references public.users(id),
  status audit_status not null default 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.responses (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  question_id uuid not null,
  verdict verdict,
  comment text,
  confidence numeric(4, 3),
  source response_source not null default 'tap',
  updated_at timestamptz not null default now(),
  unique (audit_id, question_id)
);

create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references public.responses(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  full_text text,
  utterances jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.audio_files (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  storage_path text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table public.lexicon (
  id uuid primary key default uuid_generate_v4(),
  verdict verdict not null unique,
  keywords jsonb not null,
  updated_at timestamptz not null default now()
);

-- Idempotency log for offline sync mutations.
create table public.sync_log (
  client_mutation_id text primary key,
  applied_at timestamptz not null default now()
);

create index idx_audits_auditor_status on public.audits (auditor_id, status);
create index idx_audits_vendor on public.audits (vendor_id);
create index idx_responses_audit on public.responses (audit_id);
create index idx_questions_section on public.checklist_questions (section_id, display_order);
create index idx_sections_template on public.checklist_sections (template_id, display_order);
create index idx_audio_expiry on public.audio_files (expires_at);

-- RLS — minimal POC policies. Admin role enforcement happens at the API layer
-- via service-role key for now; refine when multi-tenant work begins.
alter table public.users enable row level security;
alter table public.vendors enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_questions enable row level security;
alter table public.audits enable row level security;
alter table public.responses enable row level security;
alter table public.photos enable row level security;
alter table public.transcripts enable row level security;
alter table public.audio_files enable row level security;
alter table public.lexicon enable row level security;
alter table public.sync_log enable row level security;

create policy "auth read users" on public.users for select using (auth.role() = 'authenticated');
create policy "auth read vendors" on public.vendors for select using (auth.role() = 'authenticated');
create policy "auth read templates" on public.checklist_templates for select using (auth.role() = 'authenticated');
create policy "auth read sections" on public.checklist_sections for select using (auth.role() = 'authenticated');
create policy "auth read questions" on public.checklist_questions for select using (auth.role() = 'authenticated');
create policy "auth read lexicon" on public.lexicon for select using (auth.role() = 'authenticated');

create policy "auditor reads own audits" on public.audits
  for select using (auditor_id = auth.uid());
create policy "auditor writes own audits" on public.audits
  for update using (auditor_id = auth.uid());
create policy "auditor reads own responses" on public.responses
  for select using (exists (select 1 from public.audits a where a.id = responses.audit_id and a.auditor_id = auth.uid()));
create policy "auditor writes own responses" on public.responses
  for all using (exists (select 1 from public.audits a where a.id = responses.audit_id and a.auditor_id = auth.uid()));
