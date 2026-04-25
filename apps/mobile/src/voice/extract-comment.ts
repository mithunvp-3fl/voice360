import type { ClassifyHit } from './classifier';

const TRAILING_FILLER = /^(due to|because|cause|since|reason being|reason is|as)\s+/i;

/**
 * Extract the auditor's free-form comment from the tail of an utterance.
 *
 * Example: "Fire engine place is partial comply, due to exposed to sunlight"
 *   → keyword = "partial comply"
 *   → comment = "exposed to sunlight"
 *
 * Returns null when nothing useful follows the keyword.
 */
export function extractComment(text: string, hit: ClassifyHit | null): string | null {
  if (!hit) return null;

  const lower = text.toLowerCase();
  const kwIndex = lower.indexOf(hit.keyword);
  if (kwIndex === -1) return null;

  let tail = text.slice(kwIndex + hit.keyword.length).trim();
  // strip leading punctuation
  tail = tail.replace(/^[,;:.!?\-\s]+/, '');
  // drop a leading filler phrase ("due to ...") so the comment is the substantive part
  tail = tail.replace(TRAILING_FILLER, '');
  if (!tail) return null;

  // Capitalize first character for nicer display.
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}
