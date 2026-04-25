import { MATCH_THRESHOLDS } from '@vo360/shared';

export interface QuestionEmbedding {
  questionId: string;
  vector: Float32Array;
}

export interface MatchResult {
  questionId: string | null;
  alternateQuestionId: string | null;
  score: number | null;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Pick the best-matching question for an utterance embedding.
 * Returns the alternate questionId when the runner-up is within
 * `MATCH_THRESHOLDS.ambiguityDelta` of the winner.
 */
export function matchQuestion(
  utteranceVec: Float32Array,
  questions: QuestionEmbedding[],
): MatchResult {
  if (questions.length === 0) {
    return { questionId: null, alternateQuestionId: null, score: null };
  }

  let bestIdx = -1;
  let bestScore = -Infinity;
  let secondScore = -Infinity;
  let secondIdx = -1;

  for (let i = 0; i < questions.length; i++) {
    const score = cosine(utteranceVec, questions[i].vector);
    if (score > bestScore) {
      secondScore = bestScore;
      secondIdx = bestIdx;
      bestScore = score;
      bestIdx = i;
    } else if (score > secondScore) {
      secondScore = score;
      secondIdx = i;
    }
  }

  if (bestScore < MATCH_THRESHOLDS.topMatchMin) {
    return { questionId: null, alternateQuestionId: null, score: bestScore };
  }

  const ambiguous =
    secondIdx !== -1 && bestScore - secondScore <= MATCH_THRESHOLDS.ambiguityDelta;

  return {
    questionId: questions[bestIdx].questionId,
    alternateQuestionId: ambiguous ? questions[secondIdx].questionId : null,
    score: bestScore,
  };
}
