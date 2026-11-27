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
  /** ISO date string YYYY-MM-DD, or empty/null when unselected in filter mode */
  value: string | null;
  /** Callback receives ISO date string YYYY-MM-DD */
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  onClear?: () => void;
}

function parseIsoParts(iso: string | null): { year: number; month: number; day: number } {
  if (iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]) - 1,
        day: Number(match[3]),
      };
    }
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
  placeholder = 'dd/mm/yyyy',
  compact = false,
  onClear,
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

  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <View>
      {label ? (
        <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={`border border-zinc-200 dark:border-[#242428] rounded-lg flex-row items-center justify-between ${
          compact
            ? 'px-2.5 h-8 bg-white dark:bg-[#141416]'
            : 'px-3 py-2.5 bg-zinc-50 dark:bg-[#101012]'
        }`}
      >
        <Pressable
          onPress={handleOpen}
          className="flex-row items-center gap-2 flex-1"
        >
          <Calendar size={compact ? 13 : 15} color={colors.icon} strokeWidth={1.8} />
          <Text
            style={{ fontVariant: ['tabular-nums'] }}
            className={`${compact ? 'text-xs' : 'text-[13px]'} font-mono ${
              hasValue
                ? 'text-zinc-900 dark:text-[#F4F4F5]'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {hasValue && value ? formatDisplayDate(value) : placeholder}
          </Text>
        </Pressable>

        {hasValue && onClear ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            className="ml-1.5 pl-1.5 border-l border-zinc-200 dark:border-[#242428]"
          >
            <X size={13} color={colors.icon} />
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-center items-center bg-black/55 px-5"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#242428] rounded-xl p-4 shadow-xl"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-[15px] font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Pilih Tarikh
                </Text>
                <Text className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Format: dd/mm/yyyy
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View className="flex-row items-center justify-between mb-3">
              <Pressable
                onPress={goPrevMonth}
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-[#2A2A30] items-center justify-center"
              >
                <ChevronLeft size={16} color={colors.iconStrong} />
              </Pressable>

              <Text className="text-[13.5px] font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <Pressable
                onPress={goNextMonth}
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-[#2A2A30] items-center justify-center"
              >
                <ChevronRight size={16} color={colors.iconStrong} />
              </Pressable>
            </View>

            {/* Weekday Header */}
            <View className="flex-row mb-1.5">
              {WEEKDAY_HEADERS.map((wd) => (
                <View key={wd} className="flex-1 items-center">
                  <Text className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {wd}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="gap-0.5">
              {weeks.map((week, rowIdx) => (
                <View key={rowIdx} className="flex-row">
                  {week.map((day, colIdx) => {
                    if (day === null) {
                      return <View key={colIdx} className="flex-1 h-9" />;
                    }

                    const cellIso = toIsoDate(viewYear, viewMonth, day);
                    const isSelected = Boolean(value && cellIso === value);
                    const isToday = cellIso === todayIso;

                    return (
                      <View
                        key={colIdx}
                        className="flex-1 items-center justify-center h-9"
                      >
                        <Pressable
                          onPress={() => handleSelectDay(day)}
                          className={`w-8 h-8 rounded-lg items-center justify-center ${
                            isSelected
                              ? 'bg-zinc-900 dark:bg-[#F4F4F5]'
                              : isToday
                              ? 'bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-300 dark:border-[#32323A]'
                              : ''
                          }`}
                        >
                          <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className={`text-[13px] font-mono ${
                              isSelected
                                ? 'text-white dark:text-[#0A0A0B] font-semibold'
                                : isToday
                                ? 'text-zinc-900 dark:text-[#F4F4F5] font-semibold'
                                : 'text-zinc-700 dark:text-zinc-300'
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
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-200/80 dark:border-[#242428]">
              <Pressable
                onPress={handleSelectToday}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F]"
              >
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Hari Ini ({formatDisplayDate(todayIso)})
                </Text>
              </Pressable>

              <View className="flex-row items-center gap-2">
                {hasValue && onClear ? (
                  <Pressable
                    onPress={() => {
                      onClear();
                      setOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10"
                  >
                    <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                      Semua Tarikh
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => setOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg"
                >
                  <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Tutup
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
