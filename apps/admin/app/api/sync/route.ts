import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateAuditPdf } from '@/lib/pdf/generate';
import type { ClientMutation, SyncRequest, SyncResponse, SyncMutationResult } from '@vo360/shared';

export const runtime = 'nodejs';

/**
 * Offline sync endpoint.
 * Accepts batched mutations from the mobile app, applies them idempotently
 * via the public.sync_log primary key, and returns a per-mutation result.
 *
 * NOTE: this is the contract-level scaffold. Hardening (auth verification,
 * per-mutation validation, conflict reconciliation) lives in the polish phase.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as SyncRequest;
  if (!body?.mutations || !Array.isArray(body.mutations)) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const sb = createServiceClient();
  const results: SyncMutationResult[] = [];
  const submittedAuditIds = new Set<string>();

  for (const m of body.mutations) {
    try {
      const { data: existing } = await sb
        .from('sync_log')
        .select('client_mutation_id')
        .eq('client_mutation_id', m.clientMutationId)
        .maybeSingle();

      if (existing) {
        results.push({ clientMutationId: m.clientMutationId, status: 'duplicate' });
        continue;
      }

      await applyMutation(sb, m);
      if (m.type === 'audit.submit') {
        submittedAuditIds.add(m.payload.auditId);
      }

      await sb.from('sync_log').insert({ client_mutation_id: m.clientMutationId });
      results.push({ clientMutationId: m.clientMutationId, status: 'applied' });
    } catch (err: any) {
      results.push({
        clientMutationId: m.clientMutationId,
        status: 'error',
        message: err?.message ?? 'unknown error',
      });
    }
  }

  // Generate PDFs for any audits that were just submitted in this batch.
  // We do these sequentially (one PDF render at a time) so a slow render
  // doesn't pile up memory; failures are non-fatal — admin can regenerate
  // via /api/generate-pdf manually.
  for (const auditId of submittedAuditIds) {
    try {
      await generateAuditPdf(sb, auditId);
    } catch (err) {
      console.error('[sync] pdf generation failed', auditId, err);
    }
  }

  const response: SyncResponse = { results, serverTime: new Date().toISOString() };
  return NextResponse.json(response);
}

async function applyMutation(sb: any, m: ClientMutation): Promise<void> {
  switch (m.type) {
    case 'audit.start': {
      await sb
        .from('audits')
        .update({ status: 'in_progress', started_at: m.occurredAt })
        .eq('id', m.payload.auditId);
      return;
    }
    case 'audit.update_status': {
      await sb.from('audits').update({ status: m.payload.status }).eq('id', m.payload.auditId);
      return;
    }
    case 'audit.submit': {
      await sb
        .from('audits')
        .update({ status: 'submitted', submitted_at: m.occurredAt })
        .eq('id', m.payload.auditId);
      return;
    }
    case 'response.upsert': {
      await sb.from('responses').upsert(
        {
          id: m.payload.responseId,
          audit_id: m.payload.auditId,
          question_id: m.payload.questionId,
          verdict: m.payload.verdict,
          comment: m.payload.comment,
          confidence: m.payload.confidence,
          source: m.payload.source,
          updated_at: m.occurredAt,
        },
        { onConflict: 'audit_id,question_id' },
      );
      return;
    }
    case 'photo.attach': {
      await sb.from('photos').insert({
        id: m.payload.photoId,
        response_id: m.payload.responseId,
        storage_path: m.payload.storagePath,
      });
      return;
    }
    case 'transcript.append': {
      const { data: existing } = await sb
        .from('transcripts')
        .select('id, utterances')
        .eq('audit_id', m.payload.auditId)
        .maybeSingle();
      if (existing) {
        const merged = [...(existing.utterances ?? []), ...m.payload.utterances];
        await sb
          .from('transcripts')
          .update({ utterances: merged, updated_at: m.occurredAt })
          .eq('id', existing.id);
      } else {
        await sb.from('transcripts').insert({
          audit_id: m.payload.auditId,
          utterances: m.payload.utterances,
        });
      }
      return;
    }
  }
}
