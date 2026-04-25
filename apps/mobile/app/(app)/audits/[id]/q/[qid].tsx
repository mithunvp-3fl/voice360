import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { Verdict } from '@vo360/shared';
import { VERDICTS, VERDICT_LABELS } from '@vo360/shared';
import {
  flattenQuestions,
  getLocalAudit,
  getResponse,
  type LocalAudit,
} from '../../../../../src/lib/audits';
import { attachPhoto, upsertResponse } from '../../../../../src/lib/mutations';
import { db } from '../../../../../src/lib/db';
import {
  COLORS,
  SPACING,
  TAP_MIN,
  VERDICT_BG,
  VERDICT_COLOR,
} from '../../../../../src/lib/theme';

interface PhotoRow {
  id: string;
  local_uri: string;
}

export default function QuestionScreen() {
  const { id, qid } = useLocalSearchParams<{ id: string; qid: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<LocalAudit | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [comment, setComment] = useState('');
  const [responseId, setResponseId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPhotos = useCallback(async (rid: string | null) => {
    if (!rid) {
      setPhotos([]);
      return;
    }
    const d = await db();
    const rows = await d.getAllAsync<PhotoRow>(
      `select id, local_uri from photos where response_id = ? order by id desc`,
      [rid],
    );
    setPhotos(rows);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id || !qid) return;
      const a = await getLocalAudit(id);
      const r = await getResponse(id, qid);
      if (!active) return;
      setAudit(a);
      setVerdict((r?.verdict as Verdict | null) ?? null);
      setComment(r?.comment ?? '');
      setResponseId(r?.id ?? null);
      await loadPhotos(r?.id ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, qid, loadPhotos]);

  if (loading || !audit) {
    return (
      <SafeAreaView style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const questions = flattenQuestions(audit.template_snapshot);
  const idx = questions.findIndex((q) => q.questionId === qid);
  const question = questions[idx];
  if (!question) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Question not found.</Text>
      </SafeAreaView>
    );
  }

  const prevQ = idx > 0 ? questions[idx - 1] : null;
  const nextQ = idx < questions.length - 1 ? questions[idx + 1] : null;

  async function persist(nextVerdict: Verdict | null, nextComment: string) {
    if (!id || !qid) return;
    setSaving(true);
    try {
      const rid = await upsertResponse({
        auditId: id,
        questionId: qid,
        verdict: nextVerdict ?? undefined,
        comment: nextComment || undefined,
        source: 'tap',
      });
      setResponseId(rid);
    } finally {
      setSaving(false);
    }
  }

  async function pickVerdict(v: Verdict) {
    setVerdict(v);
    await persist(v, comment);
  }

  async function onCommentBlur() {
    if (!verdict && !comment) return;
    await persist(verdict, comment);
  }

  async function onTakePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    let rid = responseId;
    if (!rid) {
      rid = await upsertResponse({
        auditId: id!,
        questionId: qid!,
        verdict: verdict ?? undefined,
        comment: comment || undefined,
        source: 'tap',
      });
      setResponseId(rid);
    }
    await attachPhoto(rid, res.assets[0].uri);
    await loadPhotos(rid);
  }

  function go(targetQid: string) {
    router.replace(`/(app)/audits/${id}/q/${targetQid}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.section}>{question.sectionName}</Text>
            <Text style={styles.progress}>
              Question {idx + 1} of {questions.length}
              {question.isMandatory ? '' : ' · optional'}
            </Text>
          </View>
          {saving ? <ActivityIndicator /> : null}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, gap: SPACING.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.questionText}>{question.text}</Text>

          <View style={styles.verdictGrid}>
            {VERDICTS.map((v) => {
              const selected = verdict === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => pickVerdict(v)}
                  style={[
                    styles.verdictBtn,
                    selected
                      ? { backgroundColor: VERDICT_BG[v], borderColor: VERDICT_COLOR[v] }
                      : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={VERDICT_LABELS[v]}
                >
                  <View
                    style={[styles.verdictDot, { backgroundColor: VERDICT_COLOR[v] }]}
                  />
                  <Text
                    style={[
                      styles.verdictText,
                      selected ? { color: VERDICT_COLOR[v], fontWeight: '700' } : null,
                    ]}
                  >
                    {VERDICT_LABELS[v]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            <Text style={styles.fieldLabel}>Comment</Text>
            <TextInput
              style={styles.textarea}
              multiline
              value={comment}
              onChangeText={setComment}
              onBlur={onCommentBlur}
              placeholder="Optional notes…"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <View style={styles.photoRow}>
              <Text style={styles.fieldLabel}>Photos ({photos.length})</Text>
              <TouchableOpacity onPress={onTakePhoto} style={styles.photoBtn}>
                <Text style={styles.photoBtnText}>+ Photo</Text>
              </TouchableOpacity>
            </View>
            {photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {photos.map((p) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.local_uri }}
                    style={styles.photoThumb}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            disabled={!prevQ}
            onPress={() => prevQ && go(prevQ.questionId)}
            style={[styles.navBtn, !prevQ && { opacity: 0.4 }]}
          >
            <Text style={styles.navBtnText}>‹ Prev</Text>
          </TouchableOpacity>
          {nextQ ? (
            <TouchableOpacity
              onPress={() => go(nextQ.questionId)}
              style={[styles.navBtn, styles.navBtnPrimary]}
            >
              <Text style={[styles.navBtnText, { color: COLORS.primaryText }]}>Next ›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.replace(`/(app)/audits/${id}/review`)}
              style={[styles.navBtn, styles.navBtnPrimary]}
            >
              <Text style={[styles.navBtnText, { color: COLORS.primaryText }]}>
                Review ›
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  backBtn: { padding: SPACING.sm, minWidth: TAP_MIN, alignItems: 'center' },
  backText: { fontSize: 28, color: COLORS.text, lineHeight: 30 },
  section: { fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  progress: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  questionText: { fontSize: 22, fontWeight: '600', color: COLORS.text, lineHeight: 30 },
  verdictGrid: { gap: SPACING.sm },
  verdictBtn: {
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  verdictDot: { width: 14, height: 14, borderRadius: 7 },
  verdictText: { fontSize: 16, color: COLORS.text },
  fieldLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.card,
    textAlignVertical: 'top',
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  photoBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  photoBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.border },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  navBtn: {
    flex: 1,
    minHeight: TAP_MIN,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  navBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
});
