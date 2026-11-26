# Theme

## Part 1 — Token summary

Approach: Tailwind default palette via NativeWind; no CSS variables. darkMode: "class".

Colors in use (light → dark):
- App background: slate-50 #F8FAFC → slate-950 #020617
- Surface/card: white #FFFFFF → slate-900 #0F172A
- Border: slate-200 #E2E8F0 → slate-700 #334155 (header border slate-100 → slate-800)
- Text primary: slate-900 #0F172A → slate-100; secondary slate-600/500 → slate-400; muted slate-400 → slate-500
- Brand/primary: indigo-600 #4F46E5 (buttons, summary card, FAB, selected chips); links indigo-600 → indigo-400; tint bg indigo-50 → indigo-500/15
- Warning: amber-50 bg / amber-200 border / amber-800 text / icon #D97706
- Success: emerald-50 / emerald-200 / emerald-700, icon #059669 (tasks check #10B981)
- Danger: red-50 / red-200 / red-600, icon #DC2626
- Modal scrim: black/40
- Custom tokens (tailwind.config, mostly unused): brand 50 #EEF2FF, 100 #E0E7FF, 500 #4F46E5, 600 #4338CA, 700 #3730A3; surface DEFAULT #FFF, muted #F8FAFC, border #E2E8F0

Typography: system font (no custom fonts). Scale: header title text-xl bold; section title text-base semibold; body text-sm; meta text-xs; summary number text-2xl bold; tab label 11px semibold; eyebrow text-xs uppercase tracking-wider.
Radius: cards rounded-2xl (16), inputs/buttons rounded-xl (12), chips/badges rounded-full, sheets rounded-t-3xl.
Spacing: screen padding p-5 (20), section gap-5, list gap-2.5, card p-4/p-5.
Shadows: none (flat, bordered cards). Icons: lucide 12–26px.

## Part 2 — Raw sources

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};
```

### `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `src/theme/useTheme.ts`

```ts
import { colorScheme, useColorScheme } from 'nativewind';
import { create } from 'zustand';
import { themeStorage } from './themeStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

function readStoredMode(): ThemeMode {
  const stored = themeStorage.get();
  return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'system';
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
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
  primary: '#4F46E5',
  icon: '#64748B',
  iconStrong: '#334155',
  iconMuted: '#94A3B8',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  placeholder: '#94A3B8',
};

const darkColors: typeof lightColors = {
  primary: '#818CF8',
  icon: '#94A3B8',
  iconStrong: '#CBD5E1',
  iconMuted: '#64748B',
  background: '#020617',
  card: '#0F172A',
  border: '#334155',
  text: '#F1F5F9',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
  placeholder: '#64748B',
};

export type ThemeColors = typeof lightColors;

/** Resolved colors for places that need raw values (icons, navigation, etc). */
export function useThemeColors() {
  const { colorScheme: scheme } = useColorScheme();
  const isDark = scheme === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
}
```

### `app.json`

```json
{
  "expo": {
    "name": "appTracker",
    "slug": "appTracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-sqlite"
    ]
  }
}
```
