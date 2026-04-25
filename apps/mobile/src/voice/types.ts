import type { Verdict } from '@vo360/shared';

/**
 * One processed utterance, ready to surface to the auditor.
 * - `matchedQuestionId` is null when nothing crossed `MATCH_THRESHOLDS.topMatchMin`.
 * - `verdict` is null when no lexicon keyword matched.
 * - `alternateQuestionId` is set when two questions were within `ambiguityDelta`.
 */
export interface VoiceSuggestion {
  id: string;
  rawText: string;
  matchedQuestionId: string | null;
  alternateQuestionId: string | null;
  matchScore: number | null;
  verdict: Verdict | null;
  comment: string | null;
  /** ms since epoch — used to dedupe in the screen. */
  receivedAt: number;
}

export type PipelineState =
  | 'idle'
  | 'loading_models'
  | 'recording'
  | 'transcribing'
  | 'error';

export interface PipelineEvents {
  onStateChange?: (state: PipelineState, message?: string) => void;
  onLiveTranscript?: (text: string) => void;
  onSuggestion?: (s: VoiceSuggestion) => void;
}
