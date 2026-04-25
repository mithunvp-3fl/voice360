import { useCallback, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Verdict } from '@vo360/shared';
import {
  flattenQuestions,
  getLocalAudit,
  listResponses,
  type LocalAudit,
  type LocalResponse,
} from '../../../../src/lib/audits';
import { submitAudit } from '../../../../src/lib/mutations';
import { flushSyncQueue } from '../../../../src/lib/sync';
import { useSession } from '../../../../src/lib/store';
import { COLORS, SPACING, TAP_MIN, VERDICT_BG, VERDICT_COLOR } from '../../../../src/lib/theme';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useSession((s) => s.session);
  const [audit, setAudit] = useState<LocalAudit | null>(null);
  const [responses, setResponses] = useState<LocalResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!id) return;
        const a = await getLocalAudit(id);
        const rs = await listResponses(id);
        if (!active) return;
        setAudit(a);
        setResponses(rs);
      })();
      return () => {
        active = false;
      };
    }, [id]),
  );

  if (!audit) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const questions = flattenQuestions(audit.template_snapshot);
  const responseByQ = new Map(responses.map((r) => [r.question_id, r] as const));
  const missing = questions.filter(
    (q) => q.isMandatory && !responseByQ.get(q.questionId)?.verdict,
  );
  const canSubmit = missing.length === 0 && audit.status !== 'submitted';

  const sections = [...audit.template_snapshot.sections].sort((a, b) => a.order - b.order);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitAudit(audit!.id);
      const flushed = await flushSyncQueue(session?.access_token ?? null).catch(() => null);
      const offlineNote = !flushed
        ? '\nWill sync automatically when online.'
        : flushed.errors > 0
          ? `\n${flushed.errors} mutations need retry.`
          : '';
      Alert.alert('Submitted', `Audit submitted.${offlineNote}`, [
        { text: 'OK', onPress: () => router.replace('/(app)/audits') },
      ]);
    } catch (e: any) {
      Alert.alert('Submit failed', e?.message ?? 'Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Review</Text>
          <Text style={styles.meta}>
            {audit.vendor_name} · {responses.filter((r) => r.verdict).length}/{questions.length} answered
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}>
        {sections.map((section) => {
          const qs = [...section.questions].sort((a, b) => a.order - b.order);
          return (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionName}>{section.name}</Text>
              <View style={styles.list}>
                {qs.map((q, idx) => {
                  const r = responseByQ.get(q.id);
                  const v = r?.verdict as Verdict | undefined;
                  const isMissing = q.isMandatory && !v;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.item,
                        v ? { backgroundColor: VERDICT_BG[v], borderColor: VERDICT_COLOR[v] } : null,
                        isMissing ? { borderColor: COLORS.danger } : null,
                      ]}
                      onPress={() => router.push(`/(app)/audits/${audit.id}/q/${q.id}`)}
                    >
                      <Text style={styles.itemNum}>{idx + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={styles.itemText}>
                          {q.text}
                        </Text>
                        {r?.comment ? (
                          <Text style={styles.itemComment} numberOfLines={1}>
                            “{r.comment}”
                          </Text>
                        ) : null}
                      </View>
                      {v ? (
                        <View style={[styles.dot, { backgroundColor: VERDICT_COLOR[v] }]} />
                      ) : isMissing ? (
                        <Text style={styles.missing}>required</Text>
                      ) : (
                        <Text style={styles.skip}>—</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {missing.length > 0 ? (
          <Text style={styles.warning}>
            {missing.length} required question{missing.length === 1 ? '' : 's'} unanswered
          </Text>
        ) : null}
        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={onSubmit}
          style={[styles.submitBtn, (!canSubmit || submitting) && { opacity: 0.4 }]}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.primaryText} />
          ) : (
            <Text style={styles.submitText}>
              {audit.status === 'submitted' ? 'Already submitted' : 'Submit audit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  list: { gap: SPACING.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
  },
  itemNum: { width: 24, color: COLORS.textMuted, fontWeight: '600' },
  itemText: { fontSize: 14, color: COLORS.text },
  itemComment: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  missing: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },
  skip: { color: COLORS.textMuted },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  warning: { color: COLORS.danger, fontSize: 13 },
  submitBtn: {
    minHeight: TAP_MIN,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: COLORS.primaryText, fontSize: 16, fontWeight: '600' },
});
