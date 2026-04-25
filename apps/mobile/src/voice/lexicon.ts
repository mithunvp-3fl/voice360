import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DEFAULT_LEXICON, type Verdict } from '@vo360/shared';

const CACHE_KEY = 'vo360.lexicon.v1';
const LEXICON_URL =
  process.env.EXPO_PUBLIC_ADMIN_LEXICON_URL ??
  (Constants.expoConfig?.extra as any)?.adminLexiconUrl ??
  'http://localhost:3000/api/lexicon';

export type Lexicon = Record<Verdict, string[]>;

/**
 * Load the lexicon, preferring fresh remote → cached → bundled default.
 * Network failures are non-fatal because we always have the bundled fallback.
 */
export async function loadLexicon(): Promise<Lexicon> {
  try {
    const res = await fetch(LEXICON_URL, {
      headers: { 'cache-control': 'no-cache' },
    });
    if (res.ok) {
      const body = (await res.json()) as { lexicon: Lexicon };
      if (body?.lexicon) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(body.lexicon));
        return body.lexicon;
      }
    }
  } catch {
    // fall through to cache / default
  }

  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as Lexicon;
    } catch {
      // corrupt cache — drop it
      await AsyncStorage.removeItem(CACHE_KEY);
    }
  }

  return DEFAULT_LEXICON;
}
