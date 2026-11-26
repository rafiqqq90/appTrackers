import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, X } from 'lucide-react-native';
import { DatePickerField } from '../components/DatePickerField';
import { SyncStatusHeader } from '../components/SyncStatusHeader';
import { useAppStore } from '../store/useAppStore';
import type {
  BillingCycle,
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

export function SubscriptionsScreen() {
  const { isDark, colors } = useThemeColors();
  const subscriptions = useAppStore((s) => s.subscriptions);
  const addSubscription = useAppStore((s) => s.addSubscription);
  const updateSubscription = useAppStore((s) => s.updateSubscription);
  const deleteSubscription = useAppStore((s) => s.deleteSubscription);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(getLocalDateString());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('active');

  const { monthlyTotal, yearlyTotal } =
    calculateSubscriptionTotals(subscriptions);

  const openCreateModal = () => {
    setEditingId(null);
    setServiceName('');
    setAmountText('');
    setBillingCycle('monthly');
    setNextBillingDate(getLocalDateString());
    setPaymentMethod('');
    setStatus('active');
    setModalVisible(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingId(sub.id);
    setServiceName(sub.serviceName);
    setAmountText(String(sub.amount));
    setBillingCycle(sub.billingCycle);
    setNextBillingDate(sub.nextBillingDate);
    setPaymentMethod(sub.paymentMethod ?? '');
    setStatus(sub.status);
    setModalVisible(true);
  };

  const handleSave = () => {
    const amount = Number.parseFloat(amountText);
    if (!serviceName.trim() || Number.isNaN(amount) || amount <= 0) return;

    const isoBillingDate = nextBillingDate || getLocalDateString();

    if (editingId) {
      updateSubscription(editingId, {
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

    setEditingId(null);
    setServiceName('');
    setAmountText('');
    setNextBillingDate(getLocalDateString());
    setPaymentMethod('');
    setStatus('active');
    setModalVisible(false);
  };

  const fabIconColor = isDark ? '#0A0A0B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#0A0A0B]" edges={['top']}>
      <SyncStatusHeader
        title="Langganan"
        subtitle={`${subscriptions.length} rekod`}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3.5 pb-28 gap-4 max-w-2xl w-full self-center"
      >
        {/* Unified Neutral Dual-Metric Summary Card */}
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

        {/* Senarai Langganan — Unified Grouped List with 6px Status Dots */}
        <View>
          <View className="flex-row items-center justify-between px-0.5 mb-2">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Senarai Servis
            </Text>
            <Text
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
            >
              {subscriptions.length}
            </Text>
          </View>

          {subscriptions.length === 0 ? (
            <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center">
              <Text className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
                Tiada langganan direkodkan
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
                Tambah Netflix, iCloud, Spotify atau hosting supaya tidak terlepas tarikh bil.
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
              {subscriptions.map((sub, idx) => {
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
                    onPress={() => openEditModal(sub)}
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
                          {days > 3 && !isInactive ? ` (${days}h)` : days < 0 && !isInactive ? ' (Tamat)' : ''}
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
      </ScrollView>

      {/* Minimalist FAB */}
      <Pressable
        onPress={openCreateModal}
        className="absolute bottom-[72px] right-4 w-11 h-11 rounded-xl bg-zinc-900 dark:bg-[#F4F4F5] items-center justify-center shadow-lg"
      >
        <Plus size={20} color={fabIconColor} />
      </Pressable>

      {/* Modal Tambah / Sunting Langganan */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#242428] rounded-t-2xl p-5 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                {editingId ? 'Sunting Langganan' : 'Langganan Baru'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-1">
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nama Servis
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Cth: Netflix, iCloud+, Spotify"
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
                  label="Tarikh Bil"
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

            {editingId ? (
              <View className="mb-3.5">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Status Langganan
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
                onPress={handleSave}
                className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
              >
                <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                  {editingId ? 'Kemaskini Langganan' : 'Simpan Langganan'}
                </Text>
              </Pressable>

              {editingId ? (
                <Pressable
                  onPress={() => {
                    deleteSubscription(editingId);
                    setEditingId(null);
                    setModalVisible(false);
                  }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                    Padam Langganan
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
