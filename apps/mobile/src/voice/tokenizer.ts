import * as FileSystem from 'expo-file-system';

/**
 * BERT WordPiece tokenizer for sentence-transformers/all-MiniLM-L6-v2.
 *
 * Pipeline:
 *   1. BasicTokenizer — lowercase, strip accents (NFD + drop combining marks),
 *      split on whitespace and punctuation per BERT convention.
 *   2. WordPieceTokenizer — greedy longest-match subword segmentation against
 *      the bert-base-uncased vocabulary.
 *
 * Output is shaped for ONNX MiniLM: BigInt64Array tensors with [CLS] / [SEP]
 * special tokens added.
 */

const VOCAB_FILENAME = 'bert-vocab.txt';
const VOCAB_URL =
  process.env.EXPO_PUBLIC_BERT_VOCAB_URL ??
  'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/vocab.txt';

const SPECIAL = {
  pad: '[PAD]',
  unk: '[UNK]',
  cls: '[CLS]',
  sep: '[SEP]',
} as const;

const MAX_INPUT_CHARS_PER_WORD = 100;
const MAX_SEQ_LEN = 256;

let vocabPromise: Promise<Map<string, number>> | null = null;

function vocabPath(): string {
  return `${FileSystem.documentDirectory ?? ''}${VOCAB_FILENAME}`;
}

async function ensureVocab(): Promise<string> {
  const path = vocabPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && info.size && info.size > 100 * 1024) return path;
  const res = await FileSystem.downloadAsync(VOCAB_URL, path);
  if (!res?.uri) throw new Error('vocab download failed');
  return res.uri;
}

export async function loadVocab(): Promise<Map<string, number>> {
  if (!vocabPromise) {
    vocabPromise = (async () => {
      const path = await ensureVocab();
      const text = await FileSystem.readAsStringAsync(path);
      const map = new Map<string, number>();
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const tok = lines[i].replace(/\r$/, '');
        if (tok.length === 0) continue;
        map.set(tok, i);
      }
      // Sanity check — bert-base-uncased has ~30522 tokens.
      if (!map.has(SPECIAL.cls) || !map.has(SPECIAL.sep)) {
        throw new Error('vocab missing special tokens');
      }
      return map;
    })();
  }
  return vocabPromise;
}

/** BERT BasicTokenizer: lowercase, strip accents, split on whitespace + punctuation. */
export function basicTokenize(text: string): string[] {
  const lowered = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Match runs of letters/digits OR single punctuation chars; drop whitespace.
  // Hermes supports unicode property escapes.
  const matches = lowered.match(/[\p{L}\p{N}]+|[\p{P}\p{S}]/gu);
  return matches ?? [];
}

/** Greedy longest-match WordPiece for a single basic token. */
function wordPieceForToken(token: string, vocab: Map<string, number>): string[] {
  if (token.length > MAX_INPUT_CHARS_PER_WORD) return [SPECIAL.unk];

  const subwords: string[] = [];
  let start = 0;
  while (start < token.length) {
    let end = token.length;
    let matched: string | null = null;
    while (start < end) {
      const piece = (start === 0 ? '' : '##') + token.slice(start, end);
      if (vocab.has(piece)) {
        matched = piece;
        break;
      }
      end--;
    }
    if (matched === null) {
      // Couldn't segment — whole token is unknown.
      return [SPECIAL.unk];
    }
    subwords.push(matched);
    start = end;
  }
  return subwords;
}

export interface TokenizeOutput {
  inputIds: BigInt64Array;
  attentionMask: BigInt64Array;
  tokenTypeIds: BigInt64Array;
}

export async function tokenize(text: string): Promise<TokenizeOutput> {
  const vocab = await loadVocab();
  const cls = vocab.get(SPECIAL.cls)!;
  const sep = vocab.get(SPECIAL.sep)!;
  const unk = vocab.get(SPECIAL.unk)!;

  const pieces: number[] = [cls];
  const basics = basicTokenize(text);
  for (const tok of basics) {
    if (pieces.length >= MAX_SEQ_LEN - 1) break;
    const subs = wordPieceForToken(tok, vocab);
    for (const s of subs) {
      if (pieces.length >= MAX_SEQ_LEN - 1) break;
      pieces.push(vocab.get(s) ?? unk);
    }
  }
  pieces.push(sep);

  const len = pieces.length;
  const inputIds = new BigInt64Array(len);
  const attentionMask = new BigInt64Array(len);
  const tokenTypeIds = new BigInt64Array(len);
  for (let i = 0; i < len; i++) {
    inputIds[i] = BigInt(pieces[i]);
    attentionMask[i] = 1n;
    tokenTypeIds[i] = 0n;
  }

  return { inputIds, attentionMask, tokenTypeIds };
}
