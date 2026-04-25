import { renderToBuffer } from '@react-pdf/renderer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuditReport, type AuditReportData } from './audit-report';
import type { ChecklistTemplate } from '@vo360/shared';

const REPORT_BUCKET = 'reports';
const PHOTO_BUCKET = 'photos';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

export interface GenerateResult {
  reportPath: string;
  signedUrl: string | null;
}

/**
 * Render an audit's PDF, upload to the `reports` bucket, and update
 * `audits.report_path`. Reusable from both the API route and the sync
 * handler's audit.submit step.
 */
export async function generateAuditPdf(
  sb: SupabaseClient,
  auditId: string,
): Promise<GenerateResult> {
  const { data: audit, error: auditErr } = await sb
    .from('audits')
    .select(
      `id, scheduled_at, submitted_at, template_snapshot,
       vendor:vendors(name, address, contact_name, contact_phone),
       auditor:users(name)`,
    )
    .eq('id', auditId)
    .maybeSingle();

  if (auditErr || !audit) {
    throw new Error(auditErr?.message ?? 'audit not found');
  }

  const { data: responses } = await sb
    .from('responses')
    .select('id, question_id, verdict, comment, source')
    .eq('audit_id', auditId);

  const responseIds = (responses ?? []).map((r) => r.id);
  const photosByResponse = new Map<string, string[]>();
  if (responseIds.length > 0) {
    const { data: photos } = await sb
      .from('photos')
      .select('response_id, storage_path')
      .in('response_id', responseIds);
    for (const p of photos ?? []) {
      const list = photosByResponse.get(p.response_id) ?? [];
      const { data: signed } = await sb.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(p.storage_path, SIGNED_URL_TTL);
      if (signed?.signedUrl) list.push(signed.signedUrl);
      photosByResponse.set(p.response_id, list);
    }
  }

  const { data: transcript } = await sb
    .from('transcripts')
    .select('full_text')
    .eq('audit_id', auditId)
    .maybeSingle();

  const vendor = audit.vendor as
    | { name?: string; address?: string; contact_name?: string; contact_phone?: string }
    | null;
  const auditor = audit.auditor as { name?: string } | null;

  const data: AuditReportData = {
    auditId: audit.id,
    vendorName: vendor?.name ?? '—',
    vendorAddress: vendor?.address ?? '',
    vendorContact: [vendor?.contact_name, vendor?.contact_phone].filter(Boolean).join(' · '),
    auditorName: auditor?.name ?? '—',
    template: audit.template_snapshot as ChecklistTemplate,
    scheduledAt: audit.scheduled_at,
    submittedAt: audit.submitted_at,
    responses: (responses ?? []).map((r) => ({
      questionId: r.question_id,
      verdict: r.verdict,
      comment: r.comment,
      source: r.source,
      photoUrls: photosByResponse.get(r.id) ?? [],
    })),
    transcriptText: transcript?.full_text ?? null,
    generatedAt: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(AuditReport({ data }));
  const reportPath = `${auditId}.pdf`;

  const { error: uploadErr } = await sb.storage
    .from(REPORT_BUCKET)
    .upload(reportPath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadErr) throw new Error(uploadErr.message);

  await sb
    .from('audits')
    .update({ report_path: reportPath, report_generated_at: new Date().toISOString() })
    .eq('id', auditId);

  const { data: signed } = await sb.storage
    .from(REPORT_BUCKET)
    .createSignedUrl(reportPath, SIGNED_URL_TTL);

  return { reportPath, signedUrl: signed?.signedUrl ?? null };
}
