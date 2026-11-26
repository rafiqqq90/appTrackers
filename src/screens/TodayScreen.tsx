import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  MoonStar,
  Sun,
  Sunrise,
} from 'lucide-react-native';
import { ProgressRing } from '../components/ProgressRing';
import { SyncStatusHeader } from '../components/SyncStatusHeader';
import { useAppStore } from '../store/useAppStore';
import type { Task } from '../types/models';
import {
  daysUntilDate,
  formatCurrency,
  formatDisplayDate,
  isTaskScheduledForDate,
} from '../utils/formatters';
import { getLocalDateString } from '../utils/id';
import { useThemeColors } from '../theme/useTheme';

type TimeSlotKey = 'pagi' | 'petang' | 'malam' | 'sepanjang_hari';

function classifyTimeSlot(startTime: string | null): TimeSlotKey {
  if (!startTime) return 'sepanjang_hari';
  const match = /^(\d{1,2}):(\d{2})/.exec(startTime.trim());
  if (!match) return 'sepanjang_hari';
  const hour = Number(match[1]);
  if (hour < 12) return 'pagi';
  if (hour < 19) return 'petang';
  return 'malam';
}

const SLOT_META: Record<
  TimeSlotKey,
  { label: string; rangeLabel: string; Icon: typeof Sunrise; iconColor: string }
> = {
  pagi: {
    label: 'Pagi',
    rangeLabel: '05:00 – 11:59',
    Icon: Sunrise,
    iconColor: '#F59E0B',
  },
  petang: {
    label: 'Petang',
    rangeLabel: '12:00 – 18:59',
    Icon: Sun,
    iconColor: '#38BDF8',
  },
  malam: {
    label: 'Malam',
    rangeLabel: '19:00 – 23:59',
    Icon: MoonStar,
    iconColor: '#939BF5',
  },
  sepanjang_hari: {
    label: 'Bila-bila Masa',
    rangeLabel: 'Tanpa masa khusus',
    Icon: Clock,
    iconColor: '#71717A',
  },
};

const SLOT_ORDER: TimeSlotKey[] = ['pagi', 'petang', 'malam', 'sepanjang_hari'];

export function TodayScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<any>();
  const tasks = useAppStore((s) => s.tasks);
  const todayCompletions = useAppStore((s) => s.todayCompletions);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const syncState = useAppStore((s) => s.syncState);
  const triggerSync = useAppStore((s) => s.triggerSync);
  const toggleTaskDoneToday = useAppStore((s) => s.toggleTaskDoneToday);

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => isTaskScheduledForDate(t))
        .slice()
        .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')),
    [tasks]
  );

  const completedIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.taskId)),
    [todayCompletions]
  );
  const completedCount = todayTasks.filter((t) => completedIds.has(t.id)).length;
  const remainingCount = Math.max(0, todayTasks.length - completedCount);
  const progressRatio = todayTasks.length > 0 ? completedCount / todayTasks.length : 0;
  const progressPct = Math.round(progressRatio * 100);

  const groupedTasks = useMemo(() => {
    const buckets: Record<TimeSlotKey, Task[]> = {
      pagi: [],
      petang: [],
      malam: [],
      sepanjang_hari: [],
    };
    for (const task of todayTasks) {
      buckets[classifyTimeSlot(task.startTime)].push(task);
    }
    return SLOT_ORDER.filter((k) => buckets[k].length > 0).map((k) => ({
      key: k,
      meta: SLOT_META[k],
      items: buckets[k],
    }));
  }, [todayTasks]);

  const upcomingSubs = useMemo(
    () =>
      subscriptions
        .filter((sub) => {
          if (sub.status !== 'active') return false;
          const days = daysUntilDate(sub.nextBillingDate);
          return days >= 0 && days <= 7;
        })
        .sort((a, b) => daysUntilDate(a.nextBillingDate) - daysUntilDate(b.nextBillingDate)),
    [subscriptions]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#0A0A0B]" edges={['top']}>
      <SyncStatusHeader
        title="Hari Ini"
        subtitle={formatDisplayDate(getLocalDateString())}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3.5 pb-24 gap-4 max-w-2xl w-full self-center"
        refreshControl={
          <RefreshControl
            refreshing={syncState === 'syncing'}
            onRefresh={() => void triggerSync()}
            tintColor={colors.icon}
          />
        }
      >
        {/* 1. Fokus Harian — Neutral Surface Card (#141416 on #0A0A0B) + Things 3 Pie Ring + 4px Bar */}
        <View className="bg-white dark:bg-[#141416] border border-zinc-200/90 dark:border-[#242428] rounded-xl px-4 py-3.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
              <ProgressRing progress={progressRatio} size={34} />

              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Fokus Harian
                  </Text>
                  {todayTasks.length > 0 ? (
                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="text-[10.5px] font-mono font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      {progressPct}%
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5] mt-0.5"
                >
                  {completedCount}
                  <Text className="text-zinc-400 dark:text-zinc-500">
                    {' '}
                    / {todayTasks.length}{' '}
                  </Text>
                  Tugasan Siap
                </Text>
              </View>
            </View>

            <View className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-[#2A2A30]">
              <Text
                style={{ fontVariant: ['tabular-nums'] }}
                className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400"
              >
                {todayTasks.length === 0
                  ? 'Tiada jadual'
                  : remainingCount === 0
                  ? 'Selesai'
                  : `${remainingCount} berbaki`}
              </Text>
            </View>
          </View>

          {/* Sleek 4px Progress Bar */}
          <View className="mt-3 h-1 w-full rounded-full bg-zinc-100 dark:bg-[#242428] overflow-hidden">
            <View
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-emerald-500"
            />
          </View>
        </View>

        {/* 2. Jadual Blok Masa Hari Ini — Unified Grouped List (Pagi / Petang / Malam) */}
        <View>
          <View className="flex-row items-center justify-between px-0.5 mb-2">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Jadual Blok Masa Hari Ini
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Tugasan')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Urus Semua
              </Text>
              <ChevronRight size={13} color={colors.icon} />
            </Pressable>
          </View>

          {todayTasks.length === 0 ? (
            <View className="bg-white dark:bg-[#141416] rounded-xl px-4 py-5 border border-zinc-200/90 dark:border-[#242428] items-center">
              <Text className="text-[13.5px] font-medium text-zinc-700 dark:text-zinc-300">
                Tiada tugasan dijadualkan hari ini
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
                Tambah rutin harian atau blok masa di tab Tugasan.
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
              {groupedTasks.map((group, groupIdx) => {
                const SlotIcon = group.meta.Icon;
                const showGroupHeader =
                  groupedTasks.length > 1 || group.key !== 'sepanjang_hari';

                return (
                  <View
                    key={group.key}
                    className={
                      groupIdx > 0
                        ? 'border-t border-black/5 dark:border-white/5'
                        : ''
                    }
                  >
                    {showGroupHeader ? (
                      <View className="px-4 py-1.5 bg-zinc-50/90 dark:bg-[#101012] border-b border-black/5 dark:border-white/5 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <SlotIcon size={12} color={group.meta.iconColor} strokeWidth={2} />
                          <Text className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {group.meta.label}
                          </Text>
                        </View>
                        <Text
                          style={{ fontVariant: ['tabular-nums'] }}
                          className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500"
                        >
                          {group.meta.rangeLabel}
                        </Text>
                      </View>
                    ) : null}

                    {group.items.map((task, idx) => {
                      const isDone = completedIds.has(task.id);
                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => toggleTaskDoneToday(task.id)}
                          className={`py-3 px-4 flex-row items-center justify-between gap-3 ${
                            idx > 0
                              ? 'border-t border-black/5 dark:border-white/5'
                              : ''
                          }`}
                        >
                          <View className="flex-row items-center gap-3 flex-1 min-w-0">
                            <View
                              className={`w-[17px] h-[17px] rounded-[5px] border items-center justify-center shrink-0 ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {isDone ? (
                                <Check size={11} color="#FFFFFF" strokeWidth={2.6} />
                              ) : null}
                            </View>

                            <View className="flex-1 min-w-0">
                              <Text
                                numberOfLines={1}
                                className={`text-[13.5px] font-medium ${
                                  isDone
                                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                                    : 'text-zinc-900 dark:text-[#F4F4F5]'
                                }`}
                              >
                                {task.title}
                              </Text>
                              {task.description ? (
                                <Text
                                  numberOfLines={1}
                                  className={`text-xs mt-0.5 ${
                                    isDone
                                      ? 'text-zinc-400 dark:text-zinc-600'
                                      : 'text-zinc-500 dark:text-zinc-400'
                                  }`}
                                >
                                  {task.description}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          {task.startTime ? (
                            <Text
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-[11.5px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0"
                            >
                              {task.startTime}
                              {task.endTime ? ` – ${task.endTime}` : ''}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Amaran Langganan (7 Hari) — Neutral Surface + 6px Status Dots */}
        <View>
          <View className="flex-row items-center justify-between px-0.5 mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Amaran Langganan (7 Hari)
              </Text>
              {upcomingSubs.length > 0 ? (
                <View className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-[#1C1C1F]">
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400"
                  >
                    {upcomingSubs.length}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => navigation.navigate('Langganan')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Lihat Semua
              </Text>
              <ChevronRight size={13} color={colors.icon} />
            </Pressable>
          </View>

          {upcomingSubs.length === 0 ? (
            <View className="bg-white dark:bg-[#141416] rounded-xl px-4 py-3.5 border border-zinc-200/90 dark:border-[#242428]">
              <Text className="text-xs text-zinc-500 dark:text-zinc-500">
                Tiada potongan bil dalam tempoh 7 hari terdekat.
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
              {upcomingSubs.map((sub, idx) => {
                const days = daysUntilDate(sub.nextBillingDate);
                const isToday = days === 0;
                const isSoon = days > 0 && days <= 2;

                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => navigation.navigate('Langganan')}
                    className={`py-3 px-4 flex-row items-center justify-between gap-3 ${
                      idx > 0
                        ? 'border-t border-black/5 dark:border-white/5'
                        : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                      <View
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isToday ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />

                      <View className="flex-row items-center gap-2 flex-wrap flex-1 min-w-0">
                        <Text
                          numberOfLines={1}
                          className="text-[13.5px] font-medium text-zinc-900 dark:text-[#F4F4F5]"
                        >
                          {sub.serviceName}
                        </Text>

                        {isToday ? (
                          <View className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                            <Text className="text-[10.5px] font-medium text-red-600 dark:text-red-400">
                              Hari ini
                            </Text>
                          </View>
                        ) : isSoon ? (
                          <View className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            <Text className="text-[10.5px] font-medium text-amber-700 dark:text-amber-400">
                              {days} hari lagi
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-[11.5px] font-mono text-zinc-500 dark:text-zinc-500"
                          >
                            {days} hari · {formatDisplayDate(sub.nextBillingDate).slice(0, 5)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="text-[13px] font-mono font-medium text-zinc-900 dark:text-[#F4F4F5] shrink-0"
                    >
                      {formatCurrency(sub.amount, sub.currency)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Pintasan Diari — Compact Neutral Row */}
        <Pressable
          onPress={() => navigation.navigate('Diari')}
          className="bg-white dark:bg-[#141416] rounded-xl py-3 px-4 border border-zinc-200/90 dark:border-[#242428] flex-row items-center justify-between gap-3"
        >
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/70 dark:border-[#2A2A30] items-center justify-center shrink-0">
              <BookOpen size={15} color={colors.iconStrong} strokeWidth={1.8} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[13.5px] font-medium text-zinc-900 dark:text-[#F4F4F5]">
                Tulis Diari Hari Ini
              </Text>
              <Text
                numberOfLines={1}
                className="text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5"
              >
                Catat aktiviti &amp; refleksi harian anda
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 shrink-0">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Buka
            </Text>
            <ArrowRight size={13} color={colors.icon} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
