import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Database, Info, Moon, Sun, SunMoon, X } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { formatDisplayDateTime } from '../utils/formatters';
import { useThemeColors, useThemeStore } from '../theme/useTheme';

interface SyncStatusHeaderProps {
  title: string;
  subtitle?: string;
}

export function SyncStatusHeader({ title, subtitle }: SyncStatusHeaderProps) {
  const syncState = useAppStore((s) => s.syncState);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const triggerSync = useAppStore((s) => s.triggerSync);
  const themeMode = useThemeStore((s) => s.mode);
  const cycleMode = useThemeStore((s) => s.cycleMode);
  const { colors } = useThemeColors();
  const [infoOpen, setInfoOpen] = useState(false);

  const badgeConfig = {
    synced: {
      dotClass: 'bg-emerald-500',
      label: 'Synced',
    },
    syncing: {
      dotClass: 'bg-amber-500',
      label: 'Syncing',
    },
    offline: {
      dotClass: 'bg-zinc-500',
      label: 'Offline',
    },
  }[syncState];

  const ThemeIcon = { light: Sun, dark: Moon, system: SunMoon }[themeMode];
  const themeLabel = { light: 'Cerah', dark: 'Gelap', system: 'Ikut sistem' }[themeMode];

  return (
    <View className="relative z-40 flex-row items-center justify-between px-4 py-3 bg-[#F7F7F8]/95 dark:bg-[#0A0A0B]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-[#242428]">
      <View className="flex-row items-baseline gap-2.5 flex-1 pr-3 min-w-0">
        <Text
          numberOfLines={1}
          className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-500 shrink"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={cycleMode}
          accessibilityRole="button"
          accessibilityLabel={`Tema: ${themeLabel}. Tekan untuk tukar`}
          className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-[#242428] bg-white dark:bg-[#141416] items-center justify-center"
        >
          <ThemeIcon size={14} color={colors.iconStrong} strokeWidth={1.8} />
        </Pressable>

        <Pressable
          onPress={() => setInfoOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={`Status ${badgeConfig.label}. Tekan untuk info SQLite`}
          className="flex-row items-center gap-1.5 px-2.5 h-7 rounded-lg border border-zinc-200 dark:border-[#242428] bg-white dark:bg-[#141416]"
        >
          <View className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dotClass}`} />
          <Text className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {badgeConfig.label}
          </Text>
          <Info size={11} color={colors.icon} strokeWidth={1.8} />
        </Pressable>
      </View>

      {infoOpen ? (
        <View className="absolute right-4 top-12 z-50 w-64 rounded-xl p-3.5 bg-white dark:bg-[#18181C] border border-zinc-200 dark:border-[#2A2A30] shadow-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Database size={13} color={colors.success} strokeWidth={2} />
              <Text className="text-xs font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                SQLite Tempatan
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                0 ms
              </Text>
              <Pressable onPress={() => setInfoOpen(false)} hitSlop={8}>
                <X size={13} color={colors.icon} />
              </Pressable>
            </View>
          </View>

          <Text className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-4">
            Semua data disimpan terus ke storan peranti luar talian tanpa lengah &amp; disegerakkan automatik.
          </Text>

          {lastSyncedAt ? (
            <Text className="text-[10.5px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 mt-2">
              Segerak terakhir: {formatDisplayDateTime(lastSyncedAt)}
            </Text>
          ) : null}

          <Pressable
            onPress={() => {
              setInfoOpen(false);
              void triggerSync();
            }}
            className="mt-2.5 py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-[#242428] items-center"
          >
            <Text className="text-[11.5px] font-medium text-zinc-800 dark:text-zinc-200">
              Segerak Sekarang
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
