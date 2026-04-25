import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Verdict } from '@vo360/shared';
import {
  flattenQuestions,
  getLocalAudit,
  listResponses,
  type LocalAudit,
  type LocalResponse,
} from '../../../../src/lib/audits';
import { startAudit } from '../../../../src/lib/mutations';
import { COLORS, SPACING, TAP_MIN, VERDICT_BG, VERDICT_COLOR } from '../../../../src/lib/theme';

export default function AuditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<LocalAudit | null>(null);
  const [responses, setResponses] = useState<LocalResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [id]),
  );

  if (loading || !audit) {
    return (
      <SafeAreaView style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const questions = flattenQuestions(audit.template_snapshot);
  const responseByQ = new Map(responses.map((r) => [r.question_id, r] as const));
  const answered = questions.filter((q) => responseByQ.get(q.questionId)?.verdict).length;
  const isStarted = audit.status !== 'scheduled';

  async function onStart() {
    await startAudit(audit!.id);
    const fresh = await getLocalAudit(audit!.id);
    setAudit(fresh);
    if (questions.length > 0) {
      router.push(`/(app)/audits/${audit!.id}/q/${questions[0].questionId}`);
    }
  }

  const sections = [...audit.template_snapshot.sections].sort((a, b) => a.order - b.order);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.vendor}>{audit.vendor_name ?? '—'}</Text>
          <Text style={styles.meta}>
            {audit.template_snapshot.name} · {answered}/{questions.length} answered
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}>
        {sections.map((section) => {
          const qs = [...section.questions].sort((a, b) => a.order - b.order);
          return (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>SECTION {section.order}</Text>
                <Text style={styles.sectionName}>{section.name}</Text>
              </View>
              <View style={styles.grid}>
                {qs.map((q, idx) => {
                  const r = responseByQ.get(q.id);
                  const v = r?.verdict as Verdict | undefined;
                  return (
                    <Link
                      key={q.id}
                      href={`/(app)/audits/${audit.id}/q/${q.id}`}
                      asChild
                    >
                      <TouchableOpacity
                        style={[
                          styles.cell,
                          v
                            ? { backgroundColor: VERDICT_BG[v], borderColor: VERDICT_COLOR[v] }
                            : null,
                        ]}
                        accessibilityLabel={`Question ${idx + 1}`}
                      >
                        <Text style={styles.cellNumber}>{idx + 1}</Text>
                      </TouchableOpacity>
                    </Link>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {!isStarted ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
            <Text style={styles.primaryBtnText}>Start audit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: SPACING.sm }}>
            <Link href={`/(app)/audits/${audit.id}/voice`} asChild>
              <TouchableOpacity style={styles.voiceBtn}>
                <Text style={styles.voiceBtnText}>🎙  Voice mode</Text>
              </TouchableOpacity>
            </Link>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Link
                href={`/(app)/audits/${audit.id}/q/${questions[0].questionId}`}
                asChild
                style={{ flex: 1 }}
              >
                <TouchableOpacity style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </Link>
              <Link href={`/(app)/audits/${audit.id}/review`} asChild style={{ flex: 1 }}>
                <TouchableOpacity style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Review &amp; submit</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        )}
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
  vendor: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionHeader: { gap: 2 },
  sectionLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.6 },
  sectionName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  cell: {
    width: TAP_MIN,
    height: TAP_MIN,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNumber: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    minHeight: TAP_MIN,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: COLORS.primaryText, fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: TAP_MIN,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  voiceBtn: {
    minHeight: TAP_MIN,
    borderRadius: 10,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
