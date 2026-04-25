import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { listLocalAudits, pullAudits, type LocalAudit } from '../../../src/lib/audits';
import { flushSyncQueue } from '../../../src/lib/sync';
import { uploadPendingPhotos } from '../../../src/lib/photo-upload';
import { useSession } from '../../../src/lib/store';
import { supabase } from '../../../src/lib/supabase';
import { COLORS, SPACING, TAP_MIN } from '../../../src/lib/theme';

const STATUS_BG: Record<LocalAudit['status'], string> = {
  scheduled: '#e5e7eb',
  in_progress: '#fef3c7',
  draft: '#dbeafe',
  submitted: '#dcfce7',
};

const STATUS_FG: Record<LocalAudit['status'], string> = {
  scheduled: '#374151',
  in_progress: '#92400e',
  draft: '#1e40af',
  submitted: '#166534',
};

export default function AuditsScreen() {
  const { user, displayName, session } = useSession();
  const router = useRouter();
  const [audits, setAudits] = useState<LocalAudit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const photoResult = await uploadPendingPhotos(session?.access_token ?? null).catch(
        () => null,
      );
      const flushed = await flushSyncQueue(session?.access_token ?? null).catch(() => null);
      const parts: string[] = [];
      if (photoResult && photoResult.uploaded > 0) {
        parts.push(`${photoResult.uploaded} photo${photoResult.uploaded === 1 ? '' : 's'} uploaded`);
      }
      if (flushed && flushed.attempted > 0) {
        parts.push(`Synced ${flushed.applied}/${flushed.attempted}`);
        if (flushed.dropped > 0) parts.push(`${flushed.dropped} stuck`);
      }
      if (parts.length > 0) setSyncStatus(parts.join(' · '));
      await pullAudits(user.id);
      const list = await listLocalAudits();
      setAudits(list);
    } catch (e: any) {
      setSyncStatus(e?.message ? `Offline · ${e.message}` : 'Offline');
      const list = await listLocalAudits();
      setAudits(list);
    } finally {
      setRefreshing(false);
    }
  }, [user, session]);

  useEffect(() => {
    (async () => {
      const list = await listLocalAudits();
      setAudits(list);
      setBootstrapping(false);
      refresh();
    })();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      listLocalAudits().then(setAudits);
    }, []),
  );

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Today&apos;s audits</Text>
          <Text style={styles.subheading}>{displayName ?? user?.email}</Text>
          {syncStatus ? <Text style={styles.syncStatus}>{syncStatus}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={() => supabase.auth.signOut()}
          style={styles.signoutBtn}
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={audits}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: SPACING.md, gap: SPACING.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No audits scheduled</Text>
            <Text style={styles.emptySub}>Pull down to refresh.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/(app)/audits/${item.id}`} asChild>
            <TouchableOpacity style={styles.row} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={styles.rowVendor}>{item.vendor_name ?? '—'}</Text>
                <Text style={styles.rowMeta}>
                  {item.template_snapshot?.name} · {item.template_snapshot?.industry}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.scheduled_at
                    ? new Date(item.scheduled_at).toLocaleString()
                    : 'no schedule'}
                </Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: STATUS_BG[item.status] },
                ]}
              >
                <Text style={[styles.pillText, { color: STATUS_FG[item.status] }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  heading: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subheading: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  syncStatus: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  signoutBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  signoutText: { color: COLORS.textMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  rowVendor: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  rowMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  pill: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  emptySub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});
