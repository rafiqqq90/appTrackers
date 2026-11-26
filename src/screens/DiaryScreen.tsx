import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Trash2, X } from 'lucide-react-native';
import { DatePickerField } from '../components/DatePickerField';
import { SyncStatusHeader } from '../components/SyncStatusHeader';
import { useAppStore } from '../store/useAppStore';
import type { DiaryEntry } from '../types/models';
import { formatDisplayDate } from '../utils/formatters';
import { getLocalDateString } from '../utils/id';
import { useThemeColors } from '../theme/useTheme';

export function DiaryScreen() {
  const { isDark, colors } = useThemeColors();
  const diaryEntries = useAppStore((s) => s.diaryEntries);
  const addDiaryEntry = useAppStore((s) => s.addDiaryEntry);
  const updateDiaryEntry = useAppStore((s) => s.updateDiaryEntry);
  const deleteDiaryEntry = useAppStore((s) => s.deleteDiaryEntry);

  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState(getLocalDateString());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return diaryEntries;
    return diaryEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [diaryEntries, query]);

  const openCreateModal = () => {
    setEditingId(null);
    setEntryDate(getLocalDateString());
    setTitle('');
    setContent('');
    setTagsText('');
    setModalVisible(true);
  };

  const openEditModal = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setEntryDate(entry.entryDate);
    setTitle(entry.title);
    setContent(entry.content);
    setTagsText(entry.tags.join(', '));
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload = {
      entryDate: entryDate || getLocalDateString(),
      title: title.trim() || 'Catatan Harian',
      content: content.trim(),
      mood: null,
      tags,
    };

    if (editingId) {
      updateDiaryEntry(editingId, payload);
    } else {
      addDiaryEntry(payload);
    }

    setEditingId(null);
    setTitle('');
    setContent('');
    setTagsText('');
    setEntryDate(getLocalDateString());
    setModalVisible(false);
  };

  const fabIconColor = isDark ? '#0A0A0B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#0A0A0B]" edges={['top']}>
      <SyncStatusHeader
        title="Diari Harian"
        subtitle={`${diaryEntries.length} catatan`}
      />

      <View className="px-4 pt-3 pb-1 max-w-2xl w-full self-center">
        <View className="flex-row items-center bg-white dark:bg-[#141416] border border-zinc-200/90 dark:border-[#242428] rounded-lg px-3 h-9">
          <Search size={14} color={colors.icon} strokeWidth={1.8} />
          <TextInput
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari kata kunci atau #tag (luar talian)..."
            className="flex-1 ml-2 text-[13px] text-zinc-900 dark:text-[#F4F4F5]"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={14} color={colors.icon} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-2.5 pb-28 gap-3 max-w-2xl w-full self-center"
      >
        {filteredEntries.length === 0 ? (
          <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center mt-2">
            <Text className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
              {query ? 'Tiada catatan sepadan' : 'Belum ada catatan diari'}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
              Catat aktiviti dan refleksi harian anda pada bila-bila masa walaupun tanpa internet.
            </Text>
          </View>
        ) : (
          <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
            {filteredEntries.map((entry, idx) => (
              <Pressable
                key={entry.id}
                onPress={() => openEditModal(entry)}
                className={`py-3.5 px-4 ${
                  idx > 0
                    ? 'border-t border-black/5 dark:border-white/5'
                    : ''
                }`}
              >
                <View className="flex-row items-baseline justify-between gap-2">
                  <Text
                    numberOfLines={1}
                    className="text-[14px] font-medium text-zinc-900 dark:text-[#F4F4F5] flex-1"
                  >
                    {entry.title}
                  </Text>
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0"
                  >
                    {formatDisplayDate(entry.entryDate)}
                  </Text>
                </View>

                {entry.content ? (
                  <Text
                    numberOfLines={3}
                    className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed"
                  >
                    {entry.content}
                  </Text>
                ) : null}

                {entry.tags.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                    {entry.tags.map((tag) => (
                      <View
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/70 dark:border-[#2A2A30]"
                      >
                        <Text className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Minimalist FAB */}
      <Pressable
        onPress={openCreateModal}
        className="absolute bottom-[72px] right-4 w-11 h-11 rounded-xl bg-zinc-900 dark:bg-[#F4F4F5] items-center justify-center shadow-lg"
      >
        <Plus size={20} color={fabIconColor} />
      </Pressable>

      {/* Modal Tambah / Sunting Catatan */}
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
                {editingId ? 'Sunting Catatan' : 'Catatan Baru'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-1">
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Tajuk
                </Text>
                <TextInput
                  placeholderTextColor={colors.placeholder}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ringkasan hari ini..."
                  className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5]"
                />
              </View>
              <View className="w-36">
                <DatePickerField
                  label="Tarikh"
                  value={entryDate}
                  onChange={setEntryDate}
                />
              </View>
            </View>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Isi Catatan
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tulis aktiviti, pencapaian atau refleksi anda..."
              className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-3 min-h-[96px]"
            />

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Tag (pisah dengan koma)
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={tagsText}
              onChangeText={setTagsText}
              placeholder="kerja, rumah, kesihatan"
              className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-5"
            />

            <View className="gap-2">
              <Pressable
                onPress={handleSave}
                className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
              >
                <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                  {editingId ? 'Kemaskini Catatan' : 'Simpan Catatan'}
                </Text>
              </Pressable>

              {editingId ? (
                <Pressable
                  onPress={() => {
                    deleteDiaryEntry(editingId);
                    setEditingId(null);
                    setModalVisible(false);
                  }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                    Padam Catatan
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
