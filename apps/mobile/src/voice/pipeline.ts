import uuid from 'react-native-uuid';
import type { ChecklistTemplate } from '@vo360/shared';
import { flattenQuestions } from '../lib/audits';
import { ChunkedRecorder } from './audio';
import { classifyVerdict } from './classifier';
import { denoise } from './denoise';
import { embed } from './embeddings';
import { extractComment } from './extract-comment';
import { loadLexicon, type Lexicon } from './lexicon';
import { matchQuestion, type QuestionEmbedding } from './matcher';
import { getWhisper, transcribeFile, type WhisperLoadProgress } from './whisper';
import type { PipelineEvents, PipelineState, VoiceSuggestion } from './types';

/**
 * Voice pipeline orchestrator. One instance per voice-mode session.
 *
 * Lifecycle:
 *   init(template) → start() → (chunks emit suggestions via events) → stop()
 *
 * The pipeline is deliberately simple: each chunk runs through whisper, then
 * the verdict classifier (sync, regex), then the question matcher (cosine
 * sim against pre-embedded questions). Low-confidence outputs surface as
 * "couldn't match" so the auditor falls back to manual tap.
 */
export class VoicePipeline {
  private events: PipelineEvents;
  private lexicon: Lexicon | null = null;
  private questionEmbeddings: QuestionEmbedding[] = [];
  private template: ChecklistTemplate | null = null;
  private recorder: ChunkedRecorder | null = null;
  private state: PipelineState = 'idle';
  private inflight = 0;

  constructor(events: PipelineEvents) {
    this.events = events;
  }

  private setState(s: PipelineState, msg?: string) {
    this.state = s;
    this.events.onStateChange?.(s, msg);
  }

  /**
   * Load lexicon, warm up Whisper, and embed all questions in the template.
   * Embedding can fail if the tokenizer isn't configured yet — in that case
   * we still allow recording so the auditor sees live transcripts and the
   * verdict classifier still works; matching just falls back to manual.
   */
  async init(
    template: ChecklistTemplate,
    onWhisperProgress?: (p: WhisperLoadProgress) => void,
  ) {
    this.template = template;
    this.setState('loading_models', 'Loading lexicon');
    this.lexicon = await loadLexicon();

    this.setState('loading_models', 'Loading Whisper model');
    await getWhisper(onWhisperProgress);

    this.setState('loading_models', 'Embedding questions');
    const questions = flattenQuestions(template);
    const embs: QuestionEmbedding[] = [];
    for (const q of questions) {
      try {
        const v = await embed(q.text);
        embs.push({ questionId: q.questionId, vector: v });
      } catch {
        // tokenizer not configured; skip — matcher will return null.
        embs.length = 0;
        break;
      }
    }
    this.questionEmbeddings = embs;
    this.setState('idle');
  }

  async start() {
    if (this.state === 'recording') return;
    if (!this.lexicon) throw new Error('pipeline not initialized');
    this.recorder = new ChunkedRecorder({
      chunkMs: 7000,
      onChunk: (uri) => this.processChunk(uri),
      onError: (e) => this.setState('error', e.message),
    });
    await this.recorder.start();
    this.setState('recording');
  }

  async stop() {
    if (this.recorder) {
      await this.recorder.stop();
      this.recorder = null;
    }
    this.setState('idle');
  }

  private async processChunk(uri: string) {
    this.inflight++;
    if (this.state === 'recording') this.setState('transcribing');
    try {
      const cleanUri = await denoise(uri);
      const { text } = await transcribeFile(cleanUri);
      if (!text || !text.trim()) return;
      this.events.onLiveTranscript?.(text);
      await this.emitSuggestion(text);
    } catch (e: any) {
      this.events.onStateChange?.('error', e?.message ?? 'transcription failed');
    } finally {
      this.inflight--;
      if (this.inflight === 0 && this.recorder) this.setState('recording');
    }
  }

  private async emitSuggestion(rawText: string) {
    if (!this.lexicon || !this.template) return;
    const hit = classifyVerdict(rawText, this.lexicon);
    const comment = extractComment(rawText, hit);

    let matchedQuestionId: string | null = null;
    let alternateQuestionId: string | null = null;
    let matchScore: number | null = null;
    if (this.questionEmbeddings.length > 0) {
      try {
        const v = await embed(rawText);
        const m = matchQuestion(v, this.questionEmbeddings);
        matchedQuestionId = m.questionId;
        alternateQuestionId = m.alternateQuestionId;
        matchScore = m.score;
      } catch {
        // embedding failed — surface as no match; UX falls back to tap.
      }
    }

    const suggestion: VoiceSuggestion = {
      id: uuid.v4() as string,
      rawText,
      matchedQuestionId,
      alternateQuestionId,
      matchScore,
      verdict: hit?.verdict ?? null,
      comment,
      receivedAt: Date.now(),
    };
    this.events.onSuggestion?.(suggestion);
  }
}
