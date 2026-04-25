-- Add report_path column for the generated PDF location in storage.
-- Populated by /api/generate-pdf after audit submission.

alter table public.audits
  add column if not exists report_path text,
  add column if not exists report_generated_at timestamptz;
