import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { useSession } from '../src/lib/store';
import { COLORS } from '../src/lib/theme';

export default function RootLayout() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const setSession = useSession((s) => s.setSession);
  const setDisplayName = useSession((s) => s.setDisplayName);
  const session = useSession((s) => s.session);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setBootstrapped(true);
    });
    const sub = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, [setSession]);

  useEffect(() => {
    if (!session?.user) {
      setDisplayName(null);
      return;
    }
    supabase
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.name ?? session.user.email ?? null);
      });
  }, [session, setDisplayName]);

  useEffect(() => {
    if (!bootstrapped) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/audits');
    }
  }, [bootstrapped, session, segments, router]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
