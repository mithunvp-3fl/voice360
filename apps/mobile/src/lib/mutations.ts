import uuid from 'react-native-uuid';
import type { Verdict } from '@vo360/shared';
import { db, enqueueMutation } from './db';

/**
 * Mutation helpers for the auditor flow. Every helper performs the local
 * SQLite write first (so the UI is instantly consistent offline), then
 * enqueues the corresponding sync mutation for the backend.
 */

const now = () => new Date().toISOString();
const newId = () => uuid.v4() as string;

export async function startAudit(auditId: string) {
  const d = await db();
  const ts = now();
  await d.runAsync(
    `update audits set status = 'in_progress', started_at = coalesce(started_at, ?) where id = ?`,
    [ts, auditId],
  );
  await enqueueMutation('audit.start', newId(), { auditId });
}

export async function submitAudit(auditId: string) {
  const d = await db();
  const ts = now();
  await d.runAsync(
    `update audits set status = 'submitted', submitted_at = ? where id = ?`,
    [ts, auditId],
  );
  await enqueueMutation('audit.submit', newId(), { auditId });
}

export interface ResponseUpsertInput {
  auditId: string;
  questionId: string;
  verdict?: Verdict;
  comment?: string;
  confidence?: number;
  source?: 'tap' | 'voice';
}

export async function upsertResponse(input: ResponseUpsertInput) {
  const d = await db();
  const ts = now();
  const source = input.source ?? 'tap';

  const existing = await d.getFirstAsync<{ id: string }>(
    `select id from responses where audit_id = ? and question_id = ?`,
    [input.auditId, input.questionId],
  );

  const responseId = existing?.id ?? newId();

  await d.runAsync(
    `insert into responses (id, audit_id, question_id, verdict, comment, confidence, source, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(audit_id, question_id) do update set
       verdict = excluded.verdict,
       comment = excluded.comment,
       confidence = excluded.confidence,
       source = excluded.source,
       updated_at = excluded.updated_at`,
    [
      responseId,
      input.auditId,
      input.questionId,
      input.verdict ?? null,
      input.comment ?? null,
      input.confidence ?? null,
      source,
      ts,
    ],
  );

  await enqueueMutation('response.upsert', newId(), {
    responseId,
    auditId: input.auditId,
    questionId: input.questionId,
    verdict: input.verdict,
    comment: input.comment,
    confidence: input.confidence,
    source,
  });

  return responseId;
}

export async function attachPhoto(responseId: string, localUri: string, storagePath?: string) {
  const d = await db();
  const photoId = newId();
  await d.runAsync(
    `insert into photos (id, response_id, local_uri, storage_path) values (?, ?, ?, ?)`,
    [photoId, responseId, localUri, storagePath ?? null],
  );
  if (storagePath) {
    await enqueueMutation('photo.attach', newId(), { photoId, responseId, storagePath });
  }
  return photoId;
}
