import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B2420',
    background: '#FBF7F0',
    backgroundElement: '#F1EADF',
    backgroundSelected: '#E4D9C8',
    textSecondary: '#6E6259',
    border: '#E0D5C4',
    tint: '#4E7D4A',
    onTint: '#FFFFFF',
    heart: '#D1486B',
    danger: '#B3261E',
  },
  dark: {
    text: '#F4EEE6',
    background: '#171412',
    backgroundElement: '#241F1B',
    backgroundSelected: '#352E28',
    textSecondary: '#B9ADA2',
    border: '#3A322B',
    tint: '#8DBF7F',
    onTint: '#10200D',
    heart: '#F07A98',
    danger: '#F2B8B5',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
