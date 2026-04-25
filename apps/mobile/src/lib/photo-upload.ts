import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import uuid from 'react-native-uuid';
import { db, enqueueMutation } from './db';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra as any)?.supabaseUrl ??
  '';
const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra as any)?.supabaseAnonKey ??
  '';
const PHOTO_BUCKET = 'photos';

interface PendingPhoto {
  id: string;
  local_uri: string;
  response_id: string;
  audit_id: string;
}

/**
 * Upload any photos that exist locally but aren't in Supabase storage yet.
 *
 * Called from the audits screen alongside the sync flush. We use a direct
 * binary multipart upload via FileSystem.uploadAsync because supabase-js
 * binary uploads in React Native require base64 round-trips which kill
 * memory on bigger photos.
 *
 * For each successful upload we set `storage_path` locally AND enqueue a
 * `photo.attach` sync mutation so the server learns about the photo on the
 * next flush.
 */
export async function uploadPendingPhotos(authToken: string | null): Promise<{
  uploaded: number;
  failed: number;
}> {
  if (!SUPABASE_URL) return { uploaded: 0, failed: 0 };

  const d = await db();
  const rows = await d.getAllAsync<PendingPhoto>(
    `select p.id, p.local_uri, p.response_id, r.audit_id
     from photos p
     join responses r on r.id = p.response_id
     where p.storage_path is null`,
  );
  if (rows.length === 0) return { uploaded: 0, failed: 0 };

  const token = authToken ?? SUPABASE_ANON;
  let uploaded = 0;
  let failed = 0;

  for (const row of rows) {
    const path = `${row.audit_id}/${row.id}.jpg`;
    const url = `${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`;
    try {
      const res = await FileSystem.uploadAsync(url, row.local_uri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      if (res.status >= 200 && res.status < 300) {
        await d.runAsync(`update photos set storage_path = ? where id = ?`, [path, row.id]);
        await enqueueMutation('photo.attach', uuid.v4() as string, {
          photoId: row.id,
          responseId: row.response_id,
          storagePath: path,
        });
        uploaded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { uploaded, failed };
}
