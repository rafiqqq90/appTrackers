# Components

Stack: Expo SDK 58 + React Native 0.88 (react-native-web for web), React 19, TypeScript.
Navigation: @react-navigation/bottom-tabs (4 tabs, no stack). Styling: NativeWind v4 (Tailwind 3 classNames on RN primitives), darkMode "class" with `dark:` variants. Icons: lucide-react-native. State: zustand. Data: expo-sqlite + drizzle (offline-first). UI language: Malay.
Component library: none — custom RN primitives (View/Text/Pressable/TextInput/Modal/ScrollView). Target: mobile app (portrait phone), also runs on web.

Shared UI lives in `src/components/`. There are no generic primitives (Button/Card/Input); those patterns are inlined in screens with Tailwind classes:
- Card: `bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700`
- Primary button: `bg-indigo-600 rounded-xl py-3 items-center` + `text-white font-semibold`
- Input: `border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900`
- FAB: absolute bottom-right round `bg-indigo-600` with Plus icon
- Modal: bottom sheet over `bg-black/40`, `bg-white rounded-t-3xl p-5`
- Chips: `px-3 py-1.5 rounded-full border`, selected = `bg-indigo-600 border-indigo-600 text-white`

## SyncStatusHeader
Per-screen header: title, subtitle, theme toggle button, sync status badge (Synced/Syncing/Offline).
Props: title: string, subtitle?: string

### `src/components/SyncStatusHeader.tsx`

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Cloud, CloudOff, Moon, RefreshCw, Sun, SunMoon } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useThemeColors, useThemeStore } from '../theme/useTheme';

interface SyncStatusHeaderProps {
  title: string;
  subtitle?: string;
}

export function SyncStatusHeader({ title, subtitle }: SyncStatusHeaderProps) {
  const syncState = useAppStore((s) => s.syncState);
  const triggerSync = useAppStore((s) => s.triggerSync);
  const themeMode = useThemeStore((s) => s.mode);
  const cycleMode = useThemeStore((s) => s.cycleMode);
  const { colors } = useThemeColors();

  const badgeConfig = {
    synced: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      iconColor: colors.success,
      label: 'Synced',
      Icon: Cloud,
    },
    syncing: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400',
      iconColor: colors.warning,
      label: 'Syncing...',
      Icon: RefreshCw,
    },
    offline: {
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      iconColor: colors.icon,
      label: 'Offline',
      Icon: CloudOff,
    },
  }[syncState];

  const StatusIcon = badgeConfig.Icon;
  const ThemeIcon = { light: Sun, dark: Moon, system: SunMoon }[themeMode];
  const themeLabel = { light: 'Cerah', dark: 'Gelap', system: 'Ikut sistem' }[themeMode];

  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <View className="flex-1 pr-3">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={cycleMode}
          accessibilityRole="button"
          accessibilityLabel={`Tema: ${themeLabel}. Tekan untuk tukar`}
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 items-center justify-center"
        >
          <ThemeIcon size={15} color={colors.iconStrong} />
        </Pressable>

        <Pressable
          onPress={() => void triggerSync()}
          className={`flex-row items-center px-3 py-1.5 rounded-full border ${badgeConfig.bg}`}
        >
          <StatusIcon size={14} color={badgeConfig.iconColor} />
          <Text className={`text-xs font-medium ml-1.5 ${badgeConfig.text}`}>
            {badgeConfig.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

## DatePickerField
Pressable date field that opens a modal month-calendar picker.
Props: value (ISO date), onChange, label?

### `src/components/DatePickerField.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { formatDisplayDate } from '../utils/formatters';
import { getLocalDateString } from '../utils/id';
import { useThemeColors } from '../theme/useTheme';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

const WEEKDAY_HEADERS = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Aha'];

interface DatePickerFieldProps {
  /** ISO date string YYYY-MM-DD */
  value: string;
  /** Callback receives ISO date string YYYY-MM-DD */
  onChange: (isoDate: string) => void;
  label?: string;
}

function parseIsoParts(iso: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]) - 1,
      day: Number(match[3]),
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  };
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DatePickerField({
  value,
  onChange,
  label,
}: DatePickerFieldProps) {
  const { colors } = useThemeColors();
  const [open, setOpen] = useState(false);
  const parsed = parseIsoParts(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  const todayIso = getLocalDateString();

  const handleOpen = () => {
    const current = parseIsoParts(value);
    setViewYear(current.year);
    setViewMonth(current.month);
    setOpen(true);
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // Convert JS getDay (0=Sun..6=Sat) to Monday-first offset (0=Mon..6=Sun)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  const handleSelectDay = (day: number) => {
    onChange(toIsoDate(viewYear, viewMonth, day));
    setOpen(false);
  };

  const handleSelectToday = () => {
    onChange(todayIso);
    setOpen(false);
  };

  return (
    <View>
      {label ? (
        <Text className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={handleOpen}
        className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 flex-row items-center justify-between"
      >
        <Text className="text-sm text-slate-900 dark:text-slate-100">
          {formatDisplayDate(value)}
        </Text>
        <Calendar size={16} color={colors.primary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/45 px-5">
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pilih Tarikh
              </Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <X size={20} color={colors.icon} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={goPrevMonth}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <ChevronLeft size={18} color={colors.iconStrong} />
              </Pressable>

              <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <Pressable
                onPress={goNextMonth}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <ChevronRight size={18} color={colors.iconStrong} />
              </Pressable>
            </View>

            {/* Weekday Header */}
            <View className="flex-row mb-2">
              {WEEKDAY_HEADERS.map((wd) => (
                <View key={wd} className="flex-1 items-center">
                  <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {wd}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="gap-1">
              {weeks.map((week, rowIdx) => (
                <View key={rowIdx} className="flex-row">
                  {week.map((day, colIdx) => {
                    if (day === null) {
                      return <View key={colIdx} className="flex-1 h-10" />;
                    }

                    const cellIso = toIsoDate(viewYear, viewMonth, day);
                    const isSelected = cellIso === value;
                    const isToday = cellIso === todayIso;

                    return (
                      <View
                        key={colIdx}
                        className="flex-1 items-center justify-center h-10"
                      >
                        <Pressable
                          onPress={() => handleSelectDay(day)}
                          className={`w-9 h-9 rounded-full items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600'
                              : isToday
                              ? 'bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/50'
                              : ''
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              isSelected
                                ? 'text-white font-bold'
                                : isToday
                                ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Pressable
                onPress={handleSelectToday}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15"
              >
                <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Hari Ini ({formatDisplayDate(todayIso)})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setOpen(false)}
                className="px-3 py-1.5 rounded-lg"
              >
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tutup
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
```
