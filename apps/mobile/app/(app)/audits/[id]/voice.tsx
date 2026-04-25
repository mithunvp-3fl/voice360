import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VERDICT_LABELS, type Verdict } from '@vo360/shared';
import {
  flattenQuestions,
  getLocalAudit,
  type LocalAudit,
} from '../../../../src/lib/audits';
import { upsertResponse } from '../../../../src/lib/mutations';
import { VoicePipeline } from '../../../../src/voice/pipeline';
import type { PipelineState, VoiceSuggestion } from '../../../../src/voice/types';
import {
  COLORS,
  SPACING,
  TAP_MIN,
  VERDICT_BG,
  VERDICT_COLOR,
} from '../../../../src/lib/theme';

export default function VoiceModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<LocalAudit | null>(null);
  const [state, setState] = useState<PipelineState>('idle');
  const [stateMsg, setStateMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [suggestion, setSuggestion] = useState<VoiceSuggestion | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      const a = await getLocalAudit(id);
      if (!active) return;
      if (!a) {
        Alert.alert('Not found', 'Audit not available offline.');
        router.back();
        return;
      }
      setAudit(a);

      const pipeline = new VoicePipeline({
        onStateChange: (s, m) => {
          setState(s);
          setStateMsg(m ?? null);
        },
        onLiveTranscript: (t) => setTranscript(t),
        onSuggestion: (s) => setSuggestion(s),
      });
      pipelineRef.current = pipeline;
      try {
        await pipeline.init(a.template_snapshot, (p) => {
          if (p.phase === 'download') setDownloadProgress(p.progress ?? 0);
          else setDownloadProgress(null);
        });
      } catch (e: any) {
        Alert.alert('Voice setup failed', e?.message ?? 'Try again.');
      }
    })();
    return () => {
      active = false;
      pipelineRef.current?.stop();
    };
  }, [id, router]);

  const toggleRecord = useCallback(async () => {
    const p = pipelineRef.current;
    if (!p) return;
    try {
      if (state === 'recording' || state === 'transcribing') {
        await p.stop();
      } else {
        await p.start();
      }
    } catch (e: any) {
      Alert.alert('Voice error', e?.message ?? 'Could not start recording.');
    }
  }, [state]);

  if (!audit) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const questions = flattenQuestions(audit.template_snapshot);
  const matchedQuestion = suggestion?.matchedQuestionId
    ? questions.find((q) => q.questionId === suggestion.matchedQuestionId)
    : null;
  const alternateQuestion = suggestion?.alternateQuestionId
    ? questions.find((q) => q.questionId === suggestion.alternateQuestionId)
    : null;

  async function confirmSuggestion(targetQid: string, verdict: Verdict | null) {
    if (!verdict || !suggestion) return;
    await upsertResponse({
      auditId: audit!.id,
      questionId: targetQid,
      verdict,
      comment: suggestion.comment ?? undefined,
      confidence: suggestion.matchScore ?? undefined,
      source: 'voice',
    });
    setSuggestion(null);
  }

  function editSuggestion(targetQid: string) {
    router.push(`/(app)/audits/${audit!.id}/q/${targetQid}`);
  }

  const isRecording = state === 'recording' || state === 'transcribing';
  const isLoadingModels = state === 'loading_models';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Voice mode</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {audit.vendor_name} · {audit.template_snapshot.name}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingModels ? (
          <View style={styles.statusCard}>
            <ActivityIndicator />
            <Text style={styles.statusText}>{stateMsg ?? 'Preparing voice…'}</Text>
            {downloadProgress !== null ? (
              <Text style={styles.statusSub}>
                Downloading model · {Math.round(downloadProgress * 100)}%
              </Text>
            ) : null}
          </View>
        ) : null}

        {state === 'error' ? (
          <View style={[styles.statusCard, { borderColor: COLORS.danger }]}>
            <Text style={[styles.statusText, { color: COLORS.danger }]}>
              {stateMsg ?? 'Something went wrong'}
            </Text>
          </View>
        ) : null}

        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Last heard</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}

        {suggestion ? (
          <SuggestionCard
            suggestion={suggestion}
            matchedQuestion={matchedQuestion ?? null}
            alternateQuestion={alternateQuestion ?? null}
            onConfirm={confirmSuggestion}
            onEdit={editSuggestion}
            onDismiss={() => setSuggestion(null)}
          />
        ) : (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>How to use voice mode</Text>
            <Text style={styles.hintBody}>
              Tap the mic and narrate freely. Example: “Fire engine placement is
              partial comply, due to exposed to sunlight.” You&apos;ll see a
              suggestion — confirm, edit, or re-record.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={toggleRecord}
          disabled={isLoadingModels}
          style={[
            styles.micBtn,
            isRecording && styles.micBtnActive,
            isLoadingModels && { opacity: 0.4 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <Text style={styles.micText}>
            {isRecording ? '■  Listening… tap to stop' : '●  Tap to talk'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface SuggestionCardProps {
  suggestion: VoiceSuggestion;
  matchedQuestion: { questionId: string; text: string; sectionName: string } | null;
  alternateQuestion: { questionId: string; text: string; sectionName: string } | null;
  onConfirm: (qid: string, v: Verdict | null) => void;
  onEdit: (qid: string) => void;
  onDismiss: () => void;
}

function SuggestionCard({
  suggestion,
  matchedQuestion,
  alternateQuestion,
  onConfirm,
  onEdit,
  onDismiss,
}: SuggestionCardProps) {
  if (!matchedQuestion) {
    return (
      <View style={[styles.suggestionCard, { borderColor: COLORS.border }]}>
        <Text style={styles.suggestionLabel}>Couldn&apos;t match a question</Text>
        <Text style={styles.suggestionText}>
          Heard: <Text style={{ fontStyle: 'italic' }}>“{suggestion.rawText}”</Text>
        </Text>
        <Text style={styles.suggestionHint}>
          Please tap the question manually from the audit screen.
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.suggestionGhostBtn}>
          <Text style={styles.suggestionGhostText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const v = suggestion.verdict;
  const verdictColor = v ? VERDICT_COLOR[v] : COLORS.textMuted;
  const verdictBg = v ? VERDICT_BG[v] : COLORS.border;

  return (
    <View style={[styles.suggestionCard, { borderColor: verdictColor, backgroundColor: verdictBg }]}>
      <Text style={styles.suggestionLabel}>{matchedQuestion.sectionName.toUpperCase()}</Text>
      <Text style={styles.suggestionQuestion}>{matchedQuestion.text}</Text>

      <View style={styles.suggestionRow}>
        <View style={[styles.verdictPill, { backgroundColor: verdictColor }]}>
          <Text style={styles.verdictPillText}>
            {v ? VERDICT_LABELS[v] : 'No verdict heard'}
          </Text>
        </View>
        {suggestion.matchScore !== null ? (
          <Text style={styles.suggestionScore}>
            {Math.round(suggestion.matchScore * 100)}% match
          </Text>
        ) : null}
      </View>

      {suggestion.comment ? (
        <Text style={styles.suggestionComment}>“{suggestion.comment}”</Text>
      ) : null}

      <View style={styles.suggestionActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => onConfirm(matchedQuestion.questionId, v)}
          disabled={!v}
        >
          <Text style={[styles.actionText, { color: COLORS.primaryText }, !v && { opacity: 0.5 }]}>
            ✓ Confirm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(matchedQuestion.questionId)}
        >
          <Text style={styles.actionText}>✏ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDismiss}>
          <Text style={styles.actionText}>↺ Re-record</Text>
        </TouchableOpacity>
      </View>

      {alternateQuestion ? (
        <TouchableOpacity
          style={styles.alternate}
          onPress={() => onEdit(alternateQuestion.questionId)}
        >
          <Text style={styles.alternateLabel}>OR did you mean:</Text>
          <Text style={styles.alternateText} numberOfLines={2}>
            {alternateQuestion.text}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  backBtn: { paddingVertical: SPACING.sm, paddingRight: SPACING.sm },
  backText: { color: COLORS.text, fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusText: { fontSize: 14, color: COLORS.text },
  statusSub: { fontSize: 12, color: COLORS.textMuted, marginLeft: SPACING.sm },

  transcriptCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  transcriptLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  transcriptText: { fontSize: 16, color: COLORS.text, lineHeight: 22 },

  hintCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  hintTitle: { fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  hintBody: { fontSize: 13, color: '#1e3a8a', lineHeight: 18 },

  suggestionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  suggestionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  suggestionQuestion: { fontSize: 17, fontWeight: '600', color: COLORS.text, lineHeight: 22 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  verdictPill: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 999 },
  verdictPillText: { color: COLORS.primaryText, fontSize: 12, fontWeight: '700' },
  suggestionScore: { fontSize: 12, color: COLORS.textMuted },
  suggestionComment: { fontSize: 14, fontStyle: 'italic', color: COLORS.text },
  suggestionText: { fontSize: 14, color: COLORS.text },
  suggestionHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  suggestionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: TAP_MIN,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  suggestionGhostBtn: {
    minHeight: TAP_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  suggestionGhostText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },

  alternate: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  alternateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  alternateText: { fontSize: 14, color: COLORS.text },

  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  micBtn: {
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: COLORS.danger },
  micText: { color: COLORS.primaryText, fontSize: 16, fontWeight: '700' },
});
