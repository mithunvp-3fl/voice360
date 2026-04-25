import type { Verdict } from '@vo360/shared';

export const COLORS = {
  bg: '#fafafa',
  card: '#ffffff',
  text: '#0a0a0a',
  textMuted: '#6b7280',
  border: '#e5e5e5',
  primary: '#0a0a0a',
  primaryText: '#ffffff',
  danger: '#dc2626',
};

export const VERDICT_COLOR: Record<Verdict, string> = {
  majorly_comply: '#16a34a',
  partial_comply: '#f59e0b',
  not_complied: '#dc2626',
  na: '#6b7280',
};

export const VERDICT_BG: Record<Verdict, string> = {
  majorly_comply: '#dcfce7',
  partial_comply: '#fef3c7',
  not_complied: '#fee2e2',
  na: '#f3f4f6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const TAP_MIN = 56;
