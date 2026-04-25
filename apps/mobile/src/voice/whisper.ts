import * as FileSystem from 'expo-file-system';
import { initWhisper, type WhisperContext } from 'whisper.rn';

/**
 * On-device transcription via whisper.rn (Whisper base.en).
 *
 * Model is ~140MB and is downloaded on first run, then cached in the app's
 * document directory. Subsequent launches reuse the local file.
 *
 * Per plan §10: `base.en` is the chosen tier; fall back to `tiny.en` only if
 * field testing shows the mid-range device is too slow.
 */

const MODEL_FILENAME = 'ggml-base.en.bin';
const MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

/** Vocabulary biasing per plan §10 stage 3 — improves audit-domain transcription. */
const INITIAL_PROMPT =
  'GMP HACCP MOQ PPE comply partial fire safety temperature log compliance audit checklist';

let ctxPromise: Promise<WhisperContext> | null = null;

function modelPath(): string {
  const base = FileSystem.documentDirectory ?? '';
  return `${base}${MODEL_FILENAME}`;
}

export interface WhisperLoadProgress {
  phase: 'check' | 'download' | 'load';
  /** 0..1, only present during download. */
  progress?: number;
}

export async function ensureWhisperModel(
  onProgress?: (p: WhisperLoadProgress) => void,
): Promise<string> {
  const path = modelPath();
  onProgress?.({ phase: 'check' });

  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && info.size && info.size > 100 * 1024 * 1024) {
    return path;
  }

  onProgress?.({ phase: 'download', progress: 0 });
  const dl = FileSystem.createDownloadResumable(
    MODEL_URL,
    path,
    {},
    (snap) => {
      const total = snap.totalBytesExpectedToWrite || 1;
      onProgress?.({
        phase: 'download',
        progress: snap.totalBytesWritten / total,
      });
    },
  );
  const res = await dl.downloadAsync();
  if (!res?.uri) throw new Error('whisper model download failed');
  return res.uri;
}

export async function getWhisper(
  onProgress?: (p: WhisperLoadProgress) => void,
): Promise<WhisperContext> {
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const filePath = await ensureWhisperModel(onProgress);
      onProgress?.({ phase: 'load' });
      return initWhisper({ filePath });
    })();
  }
  return ctxPromise;
}

export interface TranscribeResult {
  text: string;
}

/** Transcribe a recorded audio file (wav/m4a/aac depending on platform). */
export async function transcribeFile(audioPath: string): Promise<TranscribeResult> {
  const ctx = await getWhisper();
  const { promise } = ctx.transcribe(audioPath, {
    language: 'en',
    initialPrompt: INITIAL_PROMPT,
    maxLen: 0,
  });
  const result = await promise;
  return { text: (result.result ?? '').trim() };
}

export async function releaseWhisper() {
  if (!ctxPromise) return;
  const ctx = await ctxPromise;
  await ctx.release();
  ctxPromise = null;
}
