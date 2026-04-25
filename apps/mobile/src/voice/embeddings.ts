import * as FileSystem from 'expo-file-system';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { tokenize as wordPieceTokenize } from './tokenizer';

/**
 * On-device sentence embeddings via all-MiniLM-L6-v2 (ONNX, ~22MB).
 * Both the ONNX model and the bert-base-uncased vocab are downloaded on
 * first run to the app's document directory; subsequent launches reuse them.
 *
 * Output is L2-normalized mean-pooled token embeddings — the standard
 * sentence-transformers recipe. Cosine similarity between two such vectors
 * = the matcher's score.
 */

const MODEL_FILENAME = 'minilm-l6-v2.onnx';
const MODEL_URL =
  process.env.EXPO_PUBLIC_MINILM_ONNX_URL ??
  'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx';

let sessionPromise: Promise<InferenceSession> | null = null;

function modelPath(): string {
  const base = FileSystem.documentDirectory ?? '';
  return `${base}${MODEL_FILENAME}`;
}

async function ensureModel(): Promise<string> {
  const path = modelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && info.size && info.size > 5 * 1024 * 1024) return path;

  const res = await FileSystem.downloadAsync(MODEL_URL, path);
  if (!res?.uri) throw new Error('minilm model download failed');
  return res.uri;
}

export async function getEmbeddingSession(): Promise<InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const path = await ensureModel();
      return InferenceSession.create(path);
    })();
  }
  return sessionPromise;
}

function meanPool(lastHidden: Float32Array, seqLen: number, hidden: number, mask: BigInt64Array) {
  const out = new Float32Array(hidden);
  let denom = 0;
  for (let t = 0; t < seqLen; t++) {
    const m = Number(mask[t]);
    if (m === 0) continue;
    denom += m;
    const offset = t * hidden;
    for (let h = 0; h < hidden; h++) {
      out[h] += lastHidden[offset + h] * m;
    }
  }
  if (denom === 0) return out;
  for (let h = 0; h < hidden; h++) out[h] /= denom;
  return out;
}

function l2Normalize(v: Float32Array): Float32Array {
  let mag = 0;
  for (let i = 0; i < v.length; i++) mag += v[i] * v[i];
  mag = Math.sqrt(mag);
  if (mag === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / mag;
  return out;
}

export async function embed(text: string): Promise<Float32Array> {
  const session = await getEmbeddingSession();
  const { inputIds, attentionMask, tokenTypeIds } = await wordPieceTokenize(text);
  const seqLen = inputIds.length;

  const feeds: Record<string, Tensor> = {
    input_ids: new Tensor('int64', inputIds, [1, seqLen]),
    attention_mask: new Tensor('int64', attentionMask, [1, seqLen]),
    token_type_ids: new Tensor('int64', tokenTypeIds, [1, seqLen]),
  };

  const out = await session.run(feeds);
  // sentence-transformers ONNX export uses 'last_hidden_state' as the output.
  const last = (out.last_hidden_state ?? Object.values(out)[0]) as Tensor;
  const hidden = last.dims[2];
  const data = last.data as Float32Array;
  const pooled = meanPool(data, seqLen, hidden, attentionMask);
  return l2Normalize(pooled);
}

