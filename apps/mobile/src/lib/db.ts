import * as SQLite from 'expo-sqlite';

/**
 * Local SQLite layer used for offline-first audit work.
 * Mirrors a subset of the server schema; sync queue lives here too.
 */
let _db: SQLite.SQLiteDatabase | null = null;

export async function db(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('vo360.db');
  await migrate(_db);
  return _db;
}

async function migrate(d: SQLite.SQLiteDatabase) {
  await d.execAsync(`
    pragma journal_mode = WAL;

    create table if not exists audits (
      id text primary key,
      vendor_name text,
      template_id text,
      template_snapshot text,
      status text not null default 'scheduled',
      scheduled_at text,
      started_at text,
      submitted_at text,
      synced_at text
    );

    create table if not exists responses (
      id text primary key,
      audit_id text not null,
      question_id text not null,
      verdict text,
      comment text,
      confidence real,
      source text not null default 'tap',
      updated_at text not null,
      synced_at text,
      unique (audit_id, question_id)
    );

    create table if not exists photos (
      id text primary key,
      response_id text not null,
      local_uri text not null,
      storage_path text,
      synced_at text
    );

    create table if not exists sync_queue (
      id integer primary key autoincrement,
      client_mutation_id text unique not null,
      type text not null,
      payload text not null,
      occurred_at text not null,
      attempts integer not null default 0,
      next_attempt_at text,
      last_error text
    );

    create index if not exists idx_responses_audit on responses(audit_id);
    create index if not exists idx_queue_unsent on sync_queue(attempts);
  `);
  // Best-effort migration for sessions that pre-date next_attempt_at.
  try {
    await d.execAsync(`alter table sync_queue add column next_attempt_at text;`);
  } catch {
    // column already exists
  }
}

export async function enqueueMutation(
  type: string,
  clientMutationId: string,
  payload: Record<string, unknown>,
) {
  const d = await db();
  await d.runAsync(
    `insert into sync_queue (client_mutation_id, type, payload, occurred_at) values (?, ?, ?, ?)`,
    [clientMutationId, type, JSON.stringify(payload), new Date().toISOString()],
  );
}

export const SYNC_MAX_ATTEMPTS = 8;

export async function pendingMutations() {
  const d = await db();
  const now = new Date().toISOString();
  return d.getAllAsync<{
    id: number;
    client_mutation_id: string;
    type: string;
    payload: string;
    occurred_at: string;
    attempts: number;
  }>(
    `select id, client_mutation_id, type, payload, occurred_at, attempts
     from sync_queue
     where attempts < ?
       and (next_attempt_at is null or next_attempt_at <= ?)
     order by id asc`,
    [SYNC_MAX_ATTEMPTS, now],
  );
}

export async function deadLetterCount(): Promise<number> {
  const d = await db();
  const row = await d.getFirstAsync<{ c: number }>(
    `select count(*) as c from sync_queue where attempts >= ?`,
    [SYNC_MAX_ATTEMPTS],
  );
  return row?.c ?? 0;
}
