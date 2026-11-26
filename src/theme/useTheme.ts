import { colorScheme, useColorScheme } from 'nativewind';
import { create } from 'zustand';
import { themeStorage } from './themeStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

function readStoredMode(): ThemeMode {
  const stored = themeStorage.get();
  return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'dark';
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  setMode: (mode) => {
    colorScheme.set(mode);
    themeStorage.set(mode);
    set({ mode });
  },
  cycleMode: () => {
    const next = MODES[(MODES.indexOf(get().mode) + 1) % MODES.length];
    get().setMode(next);
  },
}));

/** Call once at app start to restore the saved theme preference. */
export function initializeTheme() {
  useThemeStore.getState().setMode(readStoredMode());
}

const lightColors = {
  primary: '#18181B',
  accent: '#6366F1',
  tabActive: '#18181B',
  tabActiveIcon: '#5B67E0',
  icon: '#71717A',
  iconStrong: '#3F3F46',
  iconMuted: '#A1A1AA',
  background: '#F7F7F8',
  card: '#FFFFFF',
  elevated: '#F1F1F3',
  border: '#E4E4E7',
  tabBarBg: 'rgba(247, 247, 248, 0.85)',
  tabBarBorder: 'rgba(0, 0, 0, 0.07)',
  text: '#18181B',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#10B981',
  placeholder: '#A1A1AA',
};

const darkColors: typeof lightColors = {
  primary: '#F4F4F5',
  accent: '#939BF5',
  tabActive: '#F4F4F5',
  tabActiveIcon: '#939BF5',
  icon: '#71717A',
  iconStrong: '#A1A1AA',
  iconMuted: '#52525B',
  background: '#0A0A0B',
  card: '#141416',
  elevated: '#1C1C1F',
  border: '#242428',
  tabBarBg: 'rgba(10, 10, 11, 0.82)',
  tabBarBorder: 'rgba(255, 255, 255, 0.07)',
  text: '#F4F4F5',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  placeholder: '#52525B',
};

export type ThemeColors = typeof lightColors;

/** Resolved colors for places that need raw values (icons, navigation, SVG, etc). */
export function useThemeColors() {
  const { colorScheme: scheme } = useColorScheme();
  const isDark = scheme === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
}
