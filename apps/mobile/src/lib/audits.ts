import type { ChecklistTemplate, Verdict } from '@vo360/shared';
import { db } from './db';
import { supabase } from './supabase';

export interface LocalAudit {
  id: string;
  vendor_name: string | null;
  template_id: string;
  template_snapshot: ChecklistTemplate;
  status: 'scheduled' | 'in_progress' | 'draft' | 'submitted';
  scheduled_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
}

export interface LocalResponse {
  id: string;
  audit_id: string;
  question_id: string;
  verdict: Verdict | null;
  comment: string | null;
  confidence: number | null;
  source: 'tap' | 'voice';
  updated_at: string;
}

interface AuditRow {
  id: string;
  vendor_name: string | null;
  template_id: string;
  template_snapshot: string;
  status: LocalAudit['status'];
  scheduled_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
}

function deserializeAudit(row: AuditRow): LocalAudit {
  return {
    ...row,
    template_snapshot: JSON.parse(row.template_snapshot) as ChecklistTemplate,
  };
}

/** List audits for the current auditor from local SQLite. */
export async function listLocalAudits(): Promise<LocalAudit[]> {
  const d = await db();
  const rows = await d.getAllAsync<AuditRow>(
    `select id, vendor_name, template_id, template_snapshot, status, scheduled_at, started_at, submitted_at
     from audits
     order by coalesce(scheduled_at, '') desc`,
  );
  return rows.map(deserializeAudit);
}

export async function getLocalAudit(auditId: string): Promise<LocalAudit | null> {
  const d = await db();
  const row = await d.getFirstAsync<AuditRow>(
    `select id, vendor_name, template_id, template_snapshot, status, scheduled_at, started_at, submitted_at
     from audits where id = ?`,
    [auditId],
  );
  return row ? deserializeAudit(row) : null;
}

export async function listResponses(auditId: string): Promise<LocalResponse[]> {
  const d = await db();
  return d.getAllAsync<LocalResponse>(
    `select id, audit_id, question_id, verdict, comment, confidence, source, updated_at
     from responses where audit_id = ?`,
    [auditId],
  );
}

export async function getResponse(
  auditId: string,
  questionId: string,
): Promise<LocalResponse | null> {
  const d = await db();
  const row = await d.getFirstAsync<LocalResponse>(
    `select id, audit_id, question_id, verdict, comment, confidence, source, updated_at
     from responses where audit_id = ? and question_id = ?`,
    [auditId, questionId],
  );
  return row ?? null;
}

/**
 * Pull scheduled audits from Supabase into local SQLite. Safe to call on every
 * app foreground; existing rows are upserted, in-progress edits stay intact
 * because we never overwrite responses here.
 */
export async function pullAudits(auditorId: string) {
  const { data, error } = await supabase
    .from('audits')
    .select(
      `id, status, scheduled_at, started_at, submitted_at, template_id, template_snapshot,
       vendor:vendors(name)`,
    )
    .eq('auditor_id', auditorId);

  if (error) throw error;

  const d = await db();
  for (const a of data ?? []) {
    const vendorName = (a.vendor as { name?: string } | null)?.name ?? null;
    await d.runAsync(
      `insert into audits (id, vendor_name, template_id, template_snapshot, status, scheduled_at, started_at, submitted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         vendor_name = excluded.vendor_name,
         template_id = excluded.template_id,
         template_snapshot = excluded.template_snapshot,
         scheduled_at = excluded.scheduled_at,
         -- only advance status from server if local is still 'scheduled' (don't clobber in-progress)
         status = case when audits.status = 'scheduled' then excluded.status else audits.status end`,
      [
        a.id,
        vendorName,
        a.template_id,
        JSON.stringify(a.template_snapshot),
        a.status,
        a.scheduled_at,
        a.started_at,
        a.submitted_at,
      ],
    );
  }
}

export interface QuestionRef {
  sectionId: string;
  sectionName: string;
  questionId: string;
  text: string;
  isMandatory: boolean;
}

/** Flat ordered list of questions across all sections — used for prev/next nav. */
export function flattenQuestions(template: ChecklistTemplate): QuestionRef[] {
  const out: QuestionRef[] = [];
  const sections = [...template.sections].sort((a, b) => a.order - b.order);
  for (const s of sections) {
    const qs = [...s.questions].sort((a, b) => a.order - b.order);
    for (const q of qs) {
      out.push({
        sectionId: s.id,
        sectionName: s.name,
        questionId: q.id,
        text: q.text,
        isMandatory: q.isMandatory,
      });
    }
  }
  return out;
}
