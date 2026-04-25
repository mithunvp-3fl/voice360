import type { Verdict } from './types';

export const VERDICTS: Verdict[] = [
  'majorly_comply',
  'partial_comply',
  'not_complied',
  'na',
];

export const VERDICT_LABELS: Record<Verdict, string> = {
  majorly_comply: 'Majorly Comply',
  partial_comply: 'Partial Comply',
  not_complied: 'Not Complied',
  na: 'N/A',
};

export const VERDICT_SHORT_LABELS: Record<Verdict, string> = {
  majorly_comply: 'Comply',
  partial_comply: 'Partial',
  not_complied: 'Not',
  na: 'N/A',
};

export const VERDICT_COLORS: Record<Verdict, string> = {
  majorly_comply: '#16a34a',
  partial_comply: '#f59e0b',
  not_complied: '#dc2626',
  na: '#6b7280',
};

export const DEFAULT_LEXICON: Record<Verdict, string[]> = {
  majorly_comply: [
    'majorly comply',
    'fully comply',
    'comply',
    'complies',
    'compliant',
    'meets',
    'passes',
    'good',
    'okay',
    'fine',
    'no issues',
    'all good',
    'all clear',
    'satisfactory',
    'approved',
    'pass',
  ],
  partial_comply: [
    'partial comply',
    'partial compliance',
    'partially',
    'partial',
    'somewhat',
    'mostly but',
    'kind of',
    'sort of',
    'almost',
    'half comply',
  ],
  not_complied: [
    'not comply',
    'does not comply',
    'fails',
    'failed',
    'fail',
    'non-compliant',
    'not compliant',
    'non compliance',
    'issue',
    'problem',
    'violation',
    'bad',
    'dodgy',
    'rejected',
    'reject',
    'unsatisfactory',
  ],
  na: [
    'not applicable',
    "doesn't apply",
    'does not apply',
    'skip',
    'not relevant',
    'not required',
    'n a',
    'na',
  ],
};

/** Confidence thresholds used by the question matcher. */
export const MATCH_THRESHOLDS = {
  /** Below this, suggestion card is not shown — auditor falls back to tap. */
  topMatchMin: 0.65,
  /** If second-best is within this delta, show both options. */
  ambiguityDelta: 0.05,
} as const;
