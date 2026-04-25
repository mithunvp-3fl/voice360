import Constants from 'expo-constants';
import type { ClientMutation, SyncRequest, SyncResponse } from '@vo360/shared';
import { db, pendingMutations, SYNC_MAX_ATTEMPTS } from './db';

const SYNC_URL =
  process.env.EXPO_PUBLIC_ADMIN_SYNC_URL ??
  (Constants.expoConfig?.extra as any)?.adminSyncUrl ??
  'http://localhost:3000/api/sync';

/** Exponential backoff in seconds, capped at 1 hour. */
function backoffSeconds(attempts: number): number {
  return Math.min(60 * 60, 5 * Math.pow(2, attempts));
}

function nextAttemptIso(attempts: number): string {
  return new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString();
}

export async function flushSyncQueue(authToken: string | null): Promise<{
  attempted: number;
  applied: number;
  duplicates: number;
  errors: number;
  /** Mutations that crossed SYNC_MAX_ATTEMPTS in this flush — they're now dead-lettered. */
  dropped: number;
}> {
  const pending = await pendingMutations();
  if (pending.length === 0) {
    return { attempted: 0, applied: 0, duplicates: 0, errors: 0, dropped: 0 };
  }

  const mutations: ClientMutation[] = pending.map((row) => ({
    clientMutationId: row.client_mutation_id,
    type: row.type as ClientMutation['type'],
    occurredAt: row.occurred_at,
    payload: JSON.parse(row.payload),
  })) as ClientMutation[];

  const body: SyncRequest = { mutations };

  const res = await fetch(SYNC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Whole-batch network failure — bump attempts on every queued mutation
    // so we back off rather than thrashing.
    const d = await db();
    for (const row of pending) {
      const nextAttempts = row.attempts + 1;
      await d.runAsync(
        `update sync_queue set attempts = ?, next_attempt_at = ?, last_error = ? where client_mutation_id = ?`,
        [nextAttempts, nextAttemptIso(nextAttempts), `http ${res.status}`, row.client_mutation_id],
      );
    }
    throw new Error(`sync failed: ${res.status}`);
  }

  const result = (await res.json()) as SyncResponse;
  const d = await db();

  let applied = 0;
  let duplicates = 0;
  let errors = 0;
  let dropped = 0;

  const pendingByMid = new Map(pending.map((p) => [p.client_mutation_id, p] as const));

  for (const r of result.results) {
    if (r.status === 'applied') applied++;
    else if (r.status === 'duplicate') duplicates++;
    else errors++;

    if (r.status === 'applied' || r.status === 'duplicate') {
      await d.runAsync(`delete from sync_queue where client_mutation_id = ?`, [
        r.clientMutationId,
      ]);
    } else {
      const row = pendingByMid.get(r.clientMutationId);
      const nextAttempts = (row?.attempts ?? 0) + 1;
      if (nextAttempts >= SYNC_MAX_ATTEMPTS) dropped++;
      await d.runAsync(
        `update sync_queue set attempts = ?, next_attempt_at = ?, last_error = ? where client_mutation_id = ?`,
        [nextAttempts, nextAttemptIso(nextAttempts), r.message ?? 'unknown', r.clientMutationId],
      );
    }
  }

  return { attempted: pending.length, applied, duplicates, errors, dropped };
}
