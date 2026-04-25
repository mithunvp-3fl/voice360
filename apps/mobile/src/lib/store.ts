import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface SessionState {
  session: Session | null;
  user: User | null;
  /** name pulled from public.users; falls back to email. */
  displayName: string | null;
  setSession: (s: Session | null) => void;
  setDisplayName: (n: string | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  user: null,
  displayName: null,
  setSession: (s) => set({ session: s, user: s?.user ?? null }),
  setDisplayName: (n) => set({ displayName: n }),
}));
