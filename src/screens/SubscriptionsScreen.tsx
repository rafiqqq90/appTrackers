import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Bell,
  Check,
  Clock,
  Eye,
  FileImage,
  Plus,
  Receipt,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import { DatePickerField } from '../components/DatePickerField';
import { SyncStatusHeader } from '../components/SyncStatusHeader';
import { useAppStore } from '../store/useAppStore';
import type {
  BillingCycle,
  Expense,
  Subscription,
  SubscriptionStatus,
} from '../types/models';
import {
  calculateSubscriptionTotals,
  daysUntilDate,
  formatCurrency,
  formatDisplayDate,
} from '../utils/formatters';
import { getLocalDateString } from '../utils/id';
import { useThemeColors } from '../theme/useTheme';

type ActiveSubTab = 'komitmen' | 'perbelanjaan';

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
  { value: 'quarterly', label: 'Suku Tahun' },
  { value: 'weekly', label: 'Mingguan' },
];

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'paused', label: 'Dijeda' },
  { value: 'cancelled', label: 'Batal' },
];

const EXPENSE_CATEGORIES = [
  'Makanan',
  'Pengangkutan',
  'Barangan',
  'Bil & Utiliti',
  'Kesihatan',
  'Hiburan',
  'Lain-lain',
];

/**
 * Compresses web image Data URLs to <=1000px JPEG so offline localStorage never hits quota limits.
 */
async function compressWebImageUri(uri: string): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return uri;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const maxDim = 1000;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(uri);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      } catch {
        resolve(uri);
      }
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}

export function SubscriptionsScreen() {
  const { isDark, colors } = useThemeColors();
  const route = useRoute<any>();

  // Store state & actions
  const subscriptions = useAppStore((s) => s.subscriptions);
  const addSubscription = useAppStore((s) => s.addSubscription);
  const updateSubscription = useAppStore((s) => s.updateSubscription);
  const deleteSubscription = useAppStore((s) => s.deleteSubscription);

  const expenses = useAppStore((s) => s.expenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const toggleExpensePaid = useAppStore((s) => s.toggleExpensePaid);
  const deleteExpense = useAppStore((s) => s.deleteExpense);

  // Module-level tab & date filter (dd/mm/yyyy)
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('komitmen');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');

  useEffect(() => {
    const requestedTab = route.params?.tab;
    if (requestedTab === 'komitmen' || requestedTab === 'perbelanjaan') {
      setActiveTab(requestedTab);
    }
  }, [route.params?.tab]);

  // --- Senarai Servis Modal State ---
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(getLocalDateString());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('active');

  // --- Senarai Perbelanjaan Modal State ---
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [expAmountText, setExpAmountText] = useState('');
  const [expCategory, setExpCategory] = useState('Makanan');
  const [customCategory, setCustomCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(getLocalDateString());
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [dueDate, setDueDate] = useState<string>(getLocalDateString());
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);

  // --- Receipt Fullscreen Viewer State ---
  const [previewReceipt, setPreviewReceipt] = useState<{
    uri: string;
    title: string;
    date: string;
  } | null>(null);

  // Filtered lists & KPI calculations
  const filteredSubscriptions = useMemo(() => {
    if (!selectedDateFilter) return subscriptions;
    return subscriptions.filter((s) => s.nextBillingDate === selectedDateFilter);
  }, [subscriptions, selectedDateFilter]);

  const { monthlyTotal, yearlyTotal } =
    calculateSubscriptionTotals(subscriptions);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (
        selectedDateFilter &&
        e.expenseDate !== selectedDateFilter &&
        e.dueDate !== selectedDateFilter
      ) {
        return false;
      }
      if (selectedCategoryFilter !== 'Semua' && e.category !== selectedCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [expenses, selectedDateFilter, selectedCategoryFilter]);

  const groupedExpensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of filteredExpenses) {
      const list = map.get(exp.expenseDate);
      if (list) {
        list.push(exp);
      } else {
        map.set(exp.expenseDate, [exp]);
      }
    }
    return Array.from(map.entries())
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([dateIso, items]) => ({
        dateIso,
        items,
        dayTotal: items.reduce((sum, item) => sum + item.amount, 0),
      }));
  }, [filteredExpenses]);

  const expenseMetrics = useMemo(() => {
    const currentMonthPrefix = getLocalDateString().slice(0, 7); // YYYY-MM
    const monthTotal = expenses
      .filter((e) => e.expenseDate.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
    const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { monthTotal, filteredTotal };
  }, [expenses, filteredExpenses]);

  const usedCategories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    for (const e of expenses) {
      if (e.category) set.add(e.category);
    }
    return Array.from(set);
  }, [expenses]);

  // --- Handlers: Senarai Servis ---
  const openCreateSubModal = () => {
    setEditingSubId(null);
    setServiceName('');
    setAmountText('');
    setBillingCycle('monthly');
    setNextBillingDate(selectedDateFilter ?? getLocalDateString());
    setPaymentMethod('');
    setStatus('active');
    setSubModalVisible(true);
  };

  const openEditSubModal = (sub: Subscription) => {
    setEditingSubId(sub.id);
    setServiceName(sub.serviceName);
    setAmountText(String(sub.amount));
    setBillingCycle(sub.billingCycle);
    setNextBillingDate(sub.nextBillingDate);
    setPaymentMethod(sub.paymentMethod ?? '');
    setStatus(sub.status);
    setSubModalVisible(true);
  };

  const handleSaveSub = () => {
    const amount = Number.parseFloat(amountText);
    if (!serviceName.trim() || Number.isNaN(amount) || amount <= 0) return;

    const isoBillingDate = nextBillingDate || getLocalDateString();

    if (editingSubId) {
      updateSubscription(editingSubId, {
        serviceName: serviceName.trim(),
        amount,
        currency: 'MYR',
        billingCycle,
        nextBillingDate: isoBillingDate,
        alertDaysBefore: [7, 3, 1],
        paymentMethod: paymentMethod.trim() || null,
        status,
      });
    } else {
      addSubscription({
        serviceName: serviceName.trim(),
        amount,
        currency: 'MYR',
        billingCycle,
        nextBillingDate: isoBillingDate,
        alertDaysBefore: [7, 3, 1],
        paymentMethod: paymentMethod.trim() || null,
      });
    }

    setEditingSubId(null);
    setSubModalVisible(false);
  };

  // --- Handlers: Senarai Perbelanjaan ---
  const openCreateExpModal = () => {
    const defaultDate = selectedDateFilter ?? getLocalDateString();
    setEditingExpId(null);
    setItemName('');
    setExpAmountText('');
    setExpCategory('Makanan');
    setCustomCategory('');
    setExpenseDate(defaultDate);
    setIsPaid(true);
    setDueDate(defaultDate);
    setReceiptUri(null);
    setReceiptName(null);
    setExpModalVisible(true);
  };

  const openEditExpModal = (exp: Expense) => {
    setEditingExpId(exp.id);
    setItemName(exp.itemName);
    setExpAmountText(String(exp.amount));
    if (EXPENSE_CATEGORIES.includes(exp.category)) {
      setExpCategory(exp.category);
      setCustomCategory('');
    } else {
      setExpCategory('Lain-lain');
      setCustomCategory(exp.category);
    }
    setExpenseDate(exp.expenseDate);
    setIsPaid(exp.isPaid);
    setDueDate(exp.dueDate ?? exp.expenseDate);
    setReceiptUri(exp.receiptUri);
    setReceiptName(exp.receiptName);
    setExpModalVisible(true);
  };

  const handlePickReceipt = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.75,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const finalUri = await compressWebImageUri(asset.uri);
        setReceiptUri(finalUri);
        setReceiptName(asset.fileName ?? `resit-${formatDisplayDate(expenseDate)}.jpg`);
      }
    } catch {
      // ignore cancelled picker
    }
  };

  const handleSaveExp = () => {
    const amount = Number.parseFloat(expAmountText);
    if (!itemName.trim() || Number.isNaN(amount) || amount <= 0) return;

    const resolvedCategory =
      expCategory === 'Lain-lain' && customCategory.trim()
        ? customCategory.trim()
        : expCategory;

    const payload = {
      itemName: itemName.trim(),
      amount,
      currency: 'MYR',
      category: resolvedCategory,
      expenseDate: expenseDate || getLocalDateString(),
      isPaid,
      dueDate: isPaid ? null : dueDate || expenseDate || getLocalDateString(),
      dueTime: null,
      receiptUri,
      receiptName,
    };

    if (editingExpId) {
      updateExpense(editingExpId, payload);
    } else {
      addExpense(payload);
    }

    setEditingExpId(null);
    setExpModalVisible(false);
  };

  const fabIconColor = isDark ? '#0A0A0B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#0A0A0B]" edges={['top']}>
      <SyncStatusHeader
        title="Perbelanjaan"
        subtitle={
          activeTab === 'komitmen'
            ? `${subscriptions.length} komitmen`
            : `${expenses.length} perbelanjaan`
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3.5 pb-28 gap-3.5 max-w-2xl w-full self-center"
      >
        {/* 1. Segmented Tab Switcher: Senarai Komitmen | Senarai Perbelanjaan */}
        <View className="flex-row p-1 rounded-xl bg-zinc-200/75 dark:bg-[#141416] border border-zinc-200/90 dark:border-[#242428]">
          <Pressable
            onPress={() => setActiveTab('komitmen')}
            className={`flex-1 py-2 px-3 rounded-lg items-center justify-center flex-row gap-1.5 ${
              activeTab === 'komitmen'
                ? 'bg-white dark:bg-[#222227]'
                : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'komitmen'
                  ? 'text-zinc-900 dark:text-[#F4F4F5]'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Senarai Komitmen
            </Text>
            <Text
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-[10.5px] font-mono text-zinc-400 dark:text-zinc-500"
            >
              {subscriptions.length}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('perbelanjaan')}
            className={`flex-1 py-2 px-3 rounded-lg items-center justify-center flex-row gap-1.5 ${
              activeTab === 'perbelanjaan'
                ? 'bg-white dark:bg-[#222227]'
                : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'perbelanjaan'
                  ? 'text-zinc-900 dark:text-[#F4F4F5]'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Senarai Perbelanjaan
            </Text>
            <Text
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-[10.5px] font-mono text-zinc-400 dark:text-zinc-500"
            >
              {expenses.length}
            </Text>
          </Pressable>
        </View>

        {/* 2. Module Date Selector / Filter Bar (dd/mm/yyyy) */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => setSelectedDateFilter(null)}
              className={`h-8 px-3 rounded-lg border items-center justify-center ${
                !selectedDateFilter
                  ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                  : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-[#242428]'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  !selectedDateFilter
                    ? 'text-white dark:text-[#0A0A0B]'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Semua Tarikh
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedDateFilter(getLocalDateString())}
              className={`h-8 px-2.5 rounded-lg border items-center justify-center ${
                selectedDateFilter === getLocalDateString()
                  ? 'bg-zinc-200 dark:bg-[#242428] border-zinc-300 dark:border-zinc-600'
                  : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-[#242428]'
              }`}
            >
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Hari Ini
              </Text>
            </Pressable>
          </View>

          <View className="min-w-[148px]">
            <DatePickerField
              compact
              value={selectedDateFilter}
              placeholder="Pilih dd/mm/yyyy"
              onChange={(iso) => setSelectedDateFilter(iso)}
              onClear={() => setSelectedDateFilter(null)}
            />
          </View>
        </View>

        {activeTab === 'komitmen' ? (
          /* ================= TAB 1: SENARAI KOMITMEN ================= */
          <>
            {/* Dual-Metric Commitment Summary */}
            <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] flex-row overflow-hidden">
              <View className="flex-1 px-4 py-3.5">
                <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Komitmen Bulanan
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[17px] font-semibold font-mono text-zinc-900 dark:text-[#F4F4F5] mt-1"
                >
                  {formatCurrency(monthlyTotal)}
                </Text>
              </View>

              <View className="w-[1px] bg-black/5 dark:bg-white/5" />

              <View className="flex-1 px-4 py-3.5">
                <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Anggaran Tahunan
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[17px] font-semibold font-mono text-zinc-600 dark:text-zinc-300 mt-1"
                >
                  {formatCurrency(yearlyTotal)}
                </Text>
              </View>
            </View>

            {/* Senarai Komitmen List */}
            <View>
              <View className="flex-row items-center justify-between px-0.5 mb-2">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {selectedDateFilter
                    ? `Komitmen pada ${formatDisplayDate(selectedDateFilter)}`
                    : 'Senarai Komitmen'}
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
                >
                  {filteredSubscriptions.length}
                </Text>
              </View>

              {filteredSubscriptions.length === 0 ? (
                <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center">
                  <Text className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedDateFilter
                      ? `Tiada bil komitmen pada ${formatDisplayDate(selectedDateFilter)}`
                      : 'Tiada komitmen direkodkan'}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
                    {selectedDateFilter
                      ? 'Tekan Semua Tarikh untuk melihat keseluruhan senarai komitmen, atau tekan + untuk tambah komitmen pada tarikh ini.'
                      : 'Tambah rumah, internet, insurans, Netflix atau komitmen tetap supaya tidak terlepas tarikh bil.'}
                  </Text>
                </View>
              ) : (
                <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
                  {filteredSubscriptions.map((sub, idx) => {
                    const days = daysUntilDate(sub.nextBillingDate);
                    const isInactive = sub.status !== 'active';
                    const dotClass = isInactive
                      ? 'bg-zinc-400 dark:bg-zinc-600'
                      : days <= 0
                      ? 'bg-red-500'
                      : days <= 7
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                    return (
                      <Pressable
                        key={sub.id}
                        onPress={() => openEditSubModal(sub)}
                        className={`py-3 px-4 flex-row items-center justify-between gap-3 ${
                          idx > 0
                            ? 'border-t border-black/5 dark:border-white/5'
                            : ''
                        } ${isInactive ? 'opacity-70' : ''}`}
                      >
                        <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                          <View className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />

                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text
                                numberOfLines={1}
                                className="text-[13.5px] font-medium text-zinc-900 dark:text-[#F4F4F5]"
                              >
                                {sub.serviceName}
                              </Text>

                              {isInactive ? (
                                <View className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200 dark:border-[#2A2A30]">
                                  <Text className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                    {sub.status === 'paused' ? 'Dijeda' : 'Batal'}
                                  </Text>
                                </View>
                              ) : days === 0 ? (
                                <View className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                                  <Text className="text-[10px] font-medium text-red-600 dark:text-red-400">
                                    Hari ini
                                  </Text>
                                </View>
                              ) : days > 0 && days <= 3 ? (
                                <View className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                  <Text className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                    {days} hari lagi
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <Text
                              numberOfLines={1}
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-[11.5px] font-mono text-zinc-500 dark:text-zinc-500 mt-0.5"
                            >
                              {formatDisplayDate(sub.nextBillingDate)}
                              {days > 3 && !isInactive
                                ? ` (${days}h)`
                                : days < 0 && !isInactive
                                ? ' (Tamat)'
                                : ''}
                              {sub.paymentMethod ? ` · ${sub.paymentMethod}` : ''}
                            </Text>
                          </View>
                        </View>

                        <View className="items-end shrink-0">
                          <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-[13px] font-mono font-medium text-zinc-900 dark:text-[#F4F4F5]"
                          >
                            {formatCurrency(sub.amount, sub.currency)}
                          </Text>
                          <Text className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {CYCLE_OPTIONS.find((c) => c.value === sub.billingCycle)
                              ?.label ?? sub.billingCycle}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        ) : (
          /* ================= TAB 2: SENARAI PERBELANJAAN ================= */
          <>
            {/* Dual-Metric Expense Summary */}
            <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] flex-row overflow-hidden">
              <View className="flex-1 px-4 py-3.5">
                <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {selectedDateFilter
                    ? `Pada ${formatDisplayDate(selectedDateFilter)}`
                    : selectedCategoryFilter !== 'Semua'
                    ? `Kategori: ${selectedCategoryFilter}`
                    : 'Jumlah Ditapis'}
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[17px] font-semibold font-mono text-zinc-900 dark:text-[#F4F4F5] mt-1"
                >
                  {formatCurrency(expenseMetrics.filteredTotal)}
                </Text>
              </View>

              <View className="w-[1px] bg-black/5 dark:bg-white/5" />

              <View className="flex-1 px-4 py-3.5">
                <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Perbelanjaan Bulan Ini
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[17px] font-semibold font-mono text-zinc-600 dark:text-zinc-300 mt-1"
                >
                  {formatCurrency(expenseMetrics.monthTotal)}
                </Text>
              </View>
            </View>

            {/* Category Quick Filter Pills */}
            {expenses.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-1.5 py-0.5"
              >
                {usedCategories.map((cat) => {
                  const active = selectedCategoryFilter === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg border ${
                        active
                          ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                          : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-[#242428]'
                      }`}
                    >
                      <Text
                        className={`text-[11.5px] font-medium ${
                          active
                            ? 'text-white dark:text-[#0A0A0B]'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Senarai Perbelanjaan List */}
            <View>
              <View className="flex-row items-center justify-between px-0.5 mb-2">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {selectedDateFilter
                    ? `Perbelanjaan pada ${formatDisplayDate(selectedDateFilter)}`
                    : 'Senarai Perbelanjaan'}
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
                >
                  {filteredExpenses.length}
                </Text>
              </View>

              {filteredExpenses.length === 0 ? (
                <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center">
                  <View className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-[#2A2A30] items-center justify-center mb-2.5">
                    <Receipt size={18} color={colors.iconStrong} />
                  </View>
                  <Text className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedDateFilter
                      ? `Tiada perbelanjaan pada ${formatDisplayDate(selectedDateFilter)}`
                      : 'Belum ada perbelanjaan direkodkan'}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
                    Tekan butang + untuk masukkan item, harga, kategori, tarikh, dan lampiran resit.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {groupedExpensesByDate.map((group) => {
                    const isToday = group.dateIso === getLocalDateString();
                    return (
                      <View
                        key={group.dateIso}
                        className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden"
                      >
                        {/* Date Card Header */}
                        <View className="px-4 py-2 bg-zinc-50/90 dark:bg-[#101012] border-b border-black/5 dark:border-white/5 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <Text
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300"
                            >
                              {formatDisplayDate(group.dateIso)}
                            </Text>
                            {isToday ? (
                              <View className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-[#1C1C1F]">
                                <Text className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                  Hari Ini
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300"
                          >
                            {formatCurrency(group.dayTotal)}
                          </Text>
                        </View>

                        {/* Expense Items for this Date */}
                        {group.items.map((exp, idx) => {
                          const hasSchedule = !exp.isPaid || Boolean(exp.dueDate);
                          const dueDays = exp.dueDate ? daysUntilDate(exp.dueDate) : null;
                          const isDueUrgent = !exp.isPaid && dueDays !== null && dueDays <= 0;
                          const isDueWarning = !exp.isPaid && dueDays !== null && dueDays > 0 && dueDays <= 3;

                          return (
                            <View
                              key={exp.id}
                              className={`flex-row items-center ${
                                idx > 0
                                  ? 'border-t border-black/5 dark:border-white/5'
                                  : ''
                              }`}
                            >
                              {hasSchedule ? (
                                <Pressable
                                  onPress={() => toggleExpensePaid(exp.id)}
                                  hitSlop={8}
                                  className="pl-4 pr-2.5 py-3 justify-center"
                                >
                                  <View
                                    className={`w-[17px] h-[17px] rounded-[5px] border items-center justify-center ${
                                      exp.isPaid
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : isDueUrgent
                                        ? 'border-red-500/80'
                                        : isDueWarning
                                        ? 'border-amber-500/80'
                                        : 'border-zinc-300 dark:border-zinc-600'
                                    }`}
                                  >
                                    {exp.isPaid ? (
                                      <Check size={11} color="#FFFFFF" strokeWidth={2.6} />
                                    ) : null}
                                  </View>
                                </Pressable>
                              ) : null}

                              <Pressable
                                onPress={() => openEditExpModal(exp)}
                                className={`flex-1 py-3 pr-4 flex-row items-center justify-between gap-3 ${
                                  hasSchedule ? 'pl-0.5' : 'pl-4'
                                }`}
                              >
                                <View className="flex-1 min-w-0 pr-2">
                                  <View className="flex-row items-center gap-2 flex-wrap">
                                    <Text
                                      numberOfLines={1}
                                      className={`text-[13.5px] font-medium ${
                                        exp.isPaid && exp.dueDate
                                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                                          : 'text-zinc-900 dark:text-[#F4F4F5]'
                                      }`}
                                    >
                                      {exp.itemName}
                                    </Text>

                                    <View className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/70 dark:border-[#2A2A30]">
                                      <Text className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                        {exp.category}
                                      </Text>
                                    </View>

                                    {exp.receiptUri ? (
                                      <Pressable
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          setPreviewReceipt({
                                            uri: exp.receiptUri!,
                                            title: exp.itemName,
                                            date: formatDisplayDate(exp.expenseDate),
                                          });
                                        }}
                                        hitSlop={6}
                                        className="flex-row items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25"
                                      >
                                        <Receipt size={10} color={colors.success} />
                                        <Text className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                          Resit
                                        </Text>
                                      </Pressable>
                                    ) : null}
                                  </View>

                                  {!exp.isPaid && exp.dueDate ? (
                                    <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
                                      <Clock
                                        size={11}
                                        color={
                                          isDueUrgent
                                            ? colors.danger
                                            : isDueWarning
                                            ? colors.warning
                                            : colors.icon
                                        }
                                      />
                                      <Text
                                        style={{ fontVariant: ['tabular-nums'] }}
                                        className={`text-[11px] font-mono ${
                                          isDueUrgent
                                            ? 'text-red-600 dark:text-red-400 font-medium'
                                            : isDueWarning
                                            ? 'text-amber-700 dark:text-amber-400 font-medium'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                        }`}
                                      >
                                        Bayar: {formatDisplayDate(exp.dueDate)}
                                        {dueDays !== null
                                          ? dueDays < 0
                                            ? ` (Lewat ${Math.abs(dueDays)}h)`
                                            : dueDays === 0
                                            ? ' (Hari ini)'
                                            : ` (${dueDays} hari lagi)`
                                          : ''}
                                      </Text>
                                    </View>
                                  ) : exp.isPaid && exp.dueDate ? (
                                    <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                      Sudah dibayar
                                    </Text>
                                  ) : null}
                                </View>

                                <Text
                                  style={{ fontVariant: ['tabular-nums'] }}
                                  className="text-[13px] font-mono font-medium text-zinc-900 dark:text-[#F4F4F5] shrink-0"
                                >
                                  {formatCurrency(exp.amount, exp.currency)}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Minimalist FAB — Opens Komitmen Modal or Perbelanjaan Modal according to activeTab */}
      <Pressable
        onPress={activeTab === 'komitmen' ? openCreateSubModal : openCreateExpModal}
        className="absolute bottom-[72px] right-4 w-11 h-11 rounded-xl bg-zinc-900 dark:bg-[#F4F4F5] items-center justify-center shadow-lg"
      >
        <Plus size={20} color={fabIconColor} />
      </Pressable>

      {/* ================= MODAL 1: TAMBAH / SUNTING KOMITMEN ================= */}
      <Modal
        visible={subModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSubModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#242428] rounded-t-2xl max-h-[88%]">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="p-5 pb-8"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  {editingSubId ? 'Sunting Komitmen' : 'Komitmen Baru'}
                </Text>
                <Pressable onPress={() => setSubModalVisible(false)} className="p-1">
                  <X size={18} color={colors.icon} />
                </Pressable>
              </View>

              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Nama Komitmen
              </Text>
              <TextInput
                placeholderTextColor={colors.placeholder}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="Cth: Sewa Rumah, Unifi, Insurans, Netflix"
                className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-3"
              />

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Harga (RM)
                  </Text>
                  <TextInput
                    placeholderTextColor={colors.placeholder}
                    value={amountText}
                    onChangeText={setAmountText}
                    keyboardType="decimal-pad"
                    placeholder="55.00"
                    className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13px] font-mono text-zinc-900 dark:text-[#F4F4F5]"
                  />
                </View>
                <View className="flex-1">
                  <DatePickerField
                    label="Tarikh Bil (dd/mm/yyyy)"
                    value={nextBillingDate}
                    onChange={setNextBillingDate}
                  />
                </View>
              </View>

              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Kitaran Bil
              </Text>
              <View className="flex-row gap-1.5 mb-3.5 flex-wrap">
                {CYCLE_OPTIONS.map((opt) => {
                  const active = billingCycle === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setBillingCycle(opt.value)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        active
                          ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                          : 'bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#242428]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          active
                            ? 'text-white dark:text-[#0A0A0B]'
                            : 'text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {editingSubId ? (
                <View className="mb-3.5">
                  <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Status Komitmen
                  </Text>
                  <View className="flex-row gap-1.5">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = status === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setStatus(opt.value)}
                          className={`px-3 py-1.5 rounded-lg border ${
                            active
                              ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                              : 'bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#242428]'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              active
                                ? 'text-white dark:text-[#0A0A0B]'
                                : 'text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Kaedah Pembayaran (Pilihan)
              </Text>
              <TextInput
                placeholderTextColor={colors.placeholder}
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="Cth: Maybank Debit / ShopeePay"
                className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-5"
              />

              <View className="gap-2">
                <Pressable
                  onPress={handleSaveSub}
                  className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
                >
                  <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                    {editingSubId ? 'Kemaskini Komitmen' : 'Simpan Komitmen'}
                  </Text>
                </Pressable>

                {editingSubId ? (
                  <Pressable
                    onPress={() => {
                      deleteSubscription(editingSubId);
                      setEditingSubId(null);
                      setSubModalVisible(false);
                    }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} color={colors.danger} />
                    <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                      Padam Komitmen
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: TAMBAH / SUNTING PERBELANJAAN ================= */}
      <Modal
        visible={expModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setExpModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#242428] rounded-t-2xl max-h-[90%]">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="p-5 pb-8"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  {editingExpId ? 'Sunting Perbelanjaan' : 'Rekod Perbelanjaan Baru'}
                </Text>
                <Pressable onPress={() => setExpModalVisible(false)} className="p-1">
                  <X size={18} color={colors.icon} />
                </Pressable>
              </View>

              {/* 1. Item Apa */}
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Item Perbelanjaan
              </Text>
              <TextInput
                placeholderTextColor={colors.placeholder}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Cth: Makan Tengah Hari, Minyak RON95, Barang Dapur"
                className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-3"
              />

              {/* 2. Harga & 3. Tarikh (dd/mm/yyyy) */}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Harga (RM)
                  </Text>
                  <TextInput
                    placeholderTextColor={colors.placeholder}
                    value={expAmountText}
                    onChangeText={setExpAmountText}
                    keyboardType="decimal-pad"
                    placeholder="15.50"
                    className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13px] font-mono text-zinc-900 dark:text-[#F4F4F5]"
                  />
                </View>

                <View className="flex-1">
                  <DatePickerField
                    label="Tarikh (dd/mm/yyyy)"
                    value={expenseDate}
                    onChange={setExpenseDate}
                  />
                </View>
              </View>

              {/* 4. Kategori */}
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Kategori
              </Text>
              <View className="flex-row gap-1.5 mb-3 flex-wrap">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const active = expCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setExpCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        active
                          ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                          : 'bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#242428]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          active
                            ? 'text-white dark:text-[#0A0A0B]'
                            : 'text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {expCategory === 'Lain-lain' ? (
                <TextInput
                  placeholderTextColor={colors.placeholder}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Nama kategori tersuai (pilihan)..."
                  className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2 text-[13px] text-zinc-900 dark:text-[#F4F4F5] mb-3"
                />
              ) : null}

              {/* 5. Lampiran Resit */}
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Resit (Gambar / Lampiran)
              </Text>

              {receiptUri ? (
                <View className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-xl p-3 mb-3.5 flex-row items-center justify-between gap-3">
                  <Pressable
                    onPress={() =>
                      setPreviewReceipt({
                        uri: receiptUri,
                        title: itemName || 'Pratonton Resit',
                        date: formatDisplayDate(expenseDate),
                      })
                    }
                    className="flex-row items-center gap-3 flex-1 min-w-0"
                  >
                    <Image
                      source={{ uri: receiptUri }}
                      className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-[#1C1C1F]"
                      resizeMode="cover"
                    />
                    <View className="flex-1 min-w-0">
                      <Text
                        numberOfLines={1}
                        className="text-xs font-medium text-zinc-900 dark:text-[#F4F4F5]"
                      >
                        {receiptName || 'Resit dilampirkan'}
                      </Text>
                      <View className="flex-row items-center gap-1 mt-1">
                        <Eye size={12} color={colors.icon} />
                        <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Tekan untuk lihat penuh
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <View className="flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => void handlePickReceipt()}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-200/70 dark:bg-[#1C1C1F]"
                    >
                      <Text className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                        Tukar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setReceiptUri(null);
                        setReceiptName(null);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10"
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => void handlePickReceipt()}
                  className="bg-zinc-50 dark:bg-[#101012] border border-dashed border-zinc-300 dark:border-[#2E2E36] rounded-xl py-3.5 px-4 mb-3.5 flex-row items-center justify-center gap-2"
                >
                  <Upload size={15} color={colors.iconStrong} />
                  <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Muat Naik Gambar Resit
                  </Text>
                </Pressable>
              )}

              {/* 6. Paling Bawah: Checkbox Bayar Waktu Lain -> keluar pemilih Tarikh tanpa waktu */}
              <View className="mb-5">
                <Pressable
                  onPress={() => setIsPaid((prev) => !prev)}
                  className="flex-row items-center gap-2.5 py-1.5"
                >
                  <View
                    className={`w-[18px] h-[18px] rounded-[5px] border items-center justify-center ${
                      !isPaid
                        ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                        : 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-[#101012]'
                    }`}
                  >
                    {!isPaid ? (
                      <Check
                        size={12}
                        color={isDark ? '#0A0A0B' : '#FFFFFF'}
                        strokeWidth={2.8}
                      />
                    ) : null}
                  </View>
                  <Text className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                    Bayar waktu lain
                  </Text>
                </Pressable>

                {!isPaid ? (
                  <View className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-xl p-3 mt-2">
                    <DatePickerField
                      label="Tarikh Bayar (dd/mm/yyyy)"
                      value={dueDate}
                      onChange={setDueDate}
                    />

                    <View className="flex-row items-center gap-1.5 mt-2.5">
                      <Bell size={12} color={colors.warning} />
                      <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 flex-1">
                        Alert akan keluar di modul Hari Ini bermula 3 hari sebelum tarikh bayaran.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View className="gap-2">
                <Pressable
                  onPress={handleSaveExp}
                  className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
                >
                  <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                    {editingExpId ? 'Kemaskini Perbelanjaan' : 'Simpan Perbelanjaan'}
                  </Text>
                </Pressable>

                {editingExpId ? (
                  <Pressable
                    onPress={() => {
                      deleteExpense(editingExpId);
                      setEditingExpId(null);
                      setExpModalVisible(false);
                    }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} color={colors.danger} />
                    <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                      Padam Perbelanjaan
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: PRATONTON GAMBAR RESIT ================= */}
      <Modal
        visible={Boolean(previewReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewReceipt(null)}
      >
        <Pressable
          onPress={() => setPreviewReceipt(null)}
          className="flex-1 bg-black/80 justify-center items-center p-5"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#242428] rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-1.5">
                  <FileImage size={14} color={colors.success} />
                  <Text
                    numberOfLines={1}
                    className="text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]"
                  >
                    {previewReceipt?.title}
                  </Text>
                </View>
                <Text className="text-[11px] font-mono text-zinc-500 mt-0.5">
                  {previewReceipt?.date}
                </Text>
              </View>

              <Pressable
                onPress={() => setPreviewReceipt(null)}
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] items-center justify-center"
              >
                <X size={16} color={colors.iconStrong} />
              </Pressable>
            </View>

            {previewReceipt?.uri ? (
              <Image
                source={{ uri: previewReceipt.uri }}
                style={{ width: '100%', height: 380, borderRadius: 10 }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
