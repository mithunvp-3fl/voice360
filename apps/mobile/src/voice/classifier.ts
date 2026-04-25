import type { Verdict } from '@vo360/shared';
import type { Lexicon } from './lexicon';

export interface ClassifyHit {
  verdict: Verdict;
  /** The matched keyword (lowercased). */
  keyword: string;
  /** Char index of match start in the lowercased text. */
  index: number;
}

/**
 * Find the first verdict keyword present in the utterance.
 *
 * Multi-word phrases ("not comply") are checked before single tokens ("comply")
 * so that a long-form keyword wins over its prefix. Word boundaries are required
 * to avoid e.g. "compliance" matching "comply" inside a different sentence.
 */
export function classifyVerdict(text: string, lexicon: Lexicon): ClassifyHit | null {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;

  let best: ClassifyHit | null = null;
  for (const verdict of Object.keys(lexicon) as Verdict[]) {
    const keywords = [...lexicon[verdict]].sort((a, b) => b.length - a.length);
    for (const kw of keywords) {
      const needle = ` ${kw.toLowerCase()} `;
      const idx = haystack.indexOf(needle);
      if (idx === -1) continue;
      const hit: ClassifyHit = { verdict, keyword: kw.toLowerCase(), index: idx };
      // First match wins, but prefer earlier-in-text and longer keywords.
      if (
        !best ||
        hit.index < best.index ||
        (hit.index === best.index && hit.keyword.length > best.keyword.length)
      ) {
        best = hit;
      }
    }
  }

  return best;
}
