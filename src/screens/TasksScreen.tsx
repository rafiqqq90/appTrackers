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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { SyncStatusHeader } from '../components/SyncStatusHeader';
import { useAppStore } from '../store/useAppStore';
import type { RecurrenceType, Task, TaskFolder } from '../types/models';
import { formatDaysOfWeek } from '../utils/formatters';
import { useThemeColors } from '../theme/useTheme';

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'once', label: 'Sekali' },
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
];

const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Isn' },
  { value: 2, label: 'Sel' },
  { value: 3, label: 'Rab' },
  { value: 4, label: 'Kha' },
  { value: 5, label: 'Jum' },
  { value: 6, label: 'Sab' },
  { value: 7, label: 'Aha' },
];

export function TasksScreen() {
  const { isDark, colors } = useThemeColors();
  const taskFolders = useAppStore((s) => s.taskFolders);
  const tasks = useAppStore((s) => s.tasks);
  const todayCompletions = useAppStore((s) => s.todayCompletions);
  const addTaskFolder = useAppStore((s) => s.addTaskFolder);
  const updateTaskFolder = useAppStore((s) => s.updateTaskFolder);
  const deleteTaskFolder = useAppStore((s) => s.deleteTaskFolder);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const toggleTaskDoneToday = useAppStore((s) => s.toggleTaskDoneToday);

  const completedTaskIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.taskId)),
    [todayCompletions]
  );

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Folder Modal State
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');

  // Task Modal State
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 4]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const folderMap = useMemo(() => {
    const map = new Map<string, TaskFolder>();
    for (const f of taskFolders) map.set(f.id, f);
    return map;
  }, [taskFolders]);

  const currentFolder = currentFolderId
    ? folderMap.get(currentFolderId) ?? null
    : null;

  const breadcrumbs = useMemo(() => {
    const chain: TaskFolder[] = [];
    let cursor = currentFolder;
    let safety = 0;
    while (cursor && safety < 20) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? folderMap.get(cursor.parentId) ?? null : null;
      safety += 1;
    }
    return chain;
  }, [currentFolder, folderMap]);

  const childFolders = useMemo(
    () => taskFolders.filter((f) => (f.parentId ?? null) === currentFolderId),
    [taskFolders, currentFolderId]
  );

  const currentFolderTasks = useMemo(() => {
    if (!currentFolderId) return [];
    return tasks.filter((t) => t.folderId === currentFolderId);
  }, [tasks, currentFolderId]);

  const getFolderCounts = (folderId: string) => {
    const subfolderCount = taskFolders.filter(
      (f) => f.parentId === folderId
    ).length;
    const taskCount = tasks.filter((t) => t.folderId === folderId).length;
    return { subfolderCount, taskCount };
  };

  const openCreateFolderModal = () => {
    setEditingFolderId(null);
    setFolderName('');
    setFolderModalVisible(true);
  };

  const openEditCurrentFolderModal = () => {
    if (!currentFolder) return;
    setEditingFolderId(currentFolder.id);
    setFolderName(currentFolder.name);
    setFolderModalVisible(true);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) return;
    if (editingFolderId) {
      updateTaskFolder(editingFolderId, { name: folderName.trim() });
    } else {
      addTaskFolder({
        name: folderName.trim(),
        parentId: currentFolderId,
      });
    }
    setEditingFolderId(null);
    setFolderName('');
    setFolderModalVisible(false);
  };

  const handleDeleteFolder = () => {
    if (!editingFolderId) return;
    const parentId = folderMap.get(editingFolderId)?.parentId ?? null;
    deleteTaskFolder(editingFolderId);
    setEditingFolderId(null);
    setFolderName('');
    setFolderModalVisible(false);
    setCurrentFolderId(parentId);
  };

  const openCreateTaskModal = () => {
    if (!currentFolderId) return;
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setRecurrence('once');
    setDaysOfWeek([1, 4]);
    setStartTime('08:00');
    setEndTime('09:00');
    setTaskModalVisible(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setRecurrence(task.recurrenceType);
    setDaysOfWeek(task.daysOfWeek.length > 0 ? task.daysOfWeek : [1, 4]);
    setStartTime(task.startTime ?? '');
    setEndTime(task.endTime ?? '');
    setTaskModalVisible(true);
  };

  const toggleWeekday = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveTask = () => {
    if (!title.trim() || !currentFolderId) return;
    const payload = {
      folderId: currentFolderId,
      title: title.trim(),
      description: description.trim() || null,
      recurrenceType: recurrence,
      daysOfWeek: recurrence === 'weekly' ? daysOfWeek : [],
      startTime: startTime.trim() || null,
      endTime: endTime.trim() || null,
      remindBeforeMins: 15,
    };

    if (editingTaskId) {
      updateTask(editingTaskId, payload);
    } else {
      addTask(payload);
    }

    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setTaskModalVisible(false);
  };

  const handleGoBack = () => {
    if (!currentFolder) return;
    setCurrentFolderId(currentFolder.parentId ?? null);
  };

  const fabIconColor = isDark ? '#0A0A0B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8] dark:bg-[#0A0A0B]" edges={['top']}>
      <SyncStatusHeader
        title={currentFolder ? currentFolder.name : 'Tugasan'}
        subtitle={
          currentFolder
            ? `${childFolders.length} subfolder · ${currentFolderTasks.length} tugasan`
            : `${childFolders.length} folder`
        }
      />

      {/* Compact Breadcrumb Bar when inside a folder */}
      {currentFolder ? (
        <View className="bg-zinc-100/70 dark:bg-[#101012] border-b border-zinc-200/80 dark:border-[#242428] px-4 py-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Pressable
              onPress={handleGoBack}
              className="w-6 h-6 rounded-md bg-white dark:bg-[#18181C] border border-zinc-200 dark:border-[#242428] items-center justify-center mr-2"
            >
              <ChevronLeft size={14} color={colors.iconStrong} />
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="items-center"
            >
              <Pressable onPress={() => setCurrentFolderId(null)}>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  Folder
                </Text>
              </Pressable>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <View key={crumb.id} className="flex-row items-center">
                    <ChevronRight size={12} color={colors.iconMuted} />
                    <Pressable
                      onPress={() => setCurrentFolderId(crumb.id)}
                      disabled={isLast}
                    >
                      <Text
                        className={`text-xs ${
                          isLast
                            ? 'font-medium text-zinc-900 dark:text-[#F4F4F5]'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {crumb.name}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            onPress={openEditCurrentFolderModal}
            className="px-2 py-1 rounded-md bg-white dark:bg-[#18181C] border border-zinc-200 dark:border-[#242428]"
          >
            <Text className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              Sunting
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-3.5 pb-28 gap-4 max-w-2xl w-full self-center"
      >
        {/* ROOT LEVEL: Folders only */}
        {!currentFolder ? (
          childFolders.length === 0 ? (
            <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center mt-2">
              <View className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-[#2A2A30] items-center justify-center mb-3">
                <FolderPlus size={18} color={colors.iconStrong} />
              </View>
              <Text className="text-[14px] font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                Cipta Folder Dahulu
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center leading-5">
                Susun tugasan anda mengikut folder (cth: Rumah, Kerja, Peribadi).
              </Text>
              <Pressable
                onPress={openCreateFolderModal}
                className="mt-4 bg-zinc-900 dark:bg-[#F4F4F5] px-3.5 py-2 rounded-lg flex-row items-center gap-1.5"
              >
                <FolderPlus size={14} color={fabIconColor} />
                <Text className="text-white dark:text-[#0A0A0B] text-xs font-medium">
                  Cipta Folder Pertama
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center justify-between px-0.5 mb-2">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Senarai Folder
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
                >
                  {childFolders.length}
                </Text>
              </View>

              <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
                {childFolders.map((folder, idx) => {
                  const counts = getFolderCounts(folder.id);
                  return (
                    <Pressable
                      key={folder.id}
                      onPress={() => setCurrentFolderId(folder.id)}
                      className={`py-3 px-4 flex-row items-center justify-between gap-3 ${
                        idx > 0
                          ? 'border-t border-black/5 dark:border-white/5'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center gap-3 flex-1 min-w-0">
                        <Folder size={16} color={colors.iconStrong} strokeWidth={1.8} />
                        <Text
                          numberOfLines={1}
                          className="text-[13.5px] font-medium text-zinc-900 dark:text-[#F4F4F5] flex-1"
                        >
                          {folder.name}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2 shrink-0">
                        <Text
                          style={{ fontVariant: ['tabular-nums'] }}
                          className="text-[11.5px] font-mono text-zinc-400 dark:text-zinc-500"
                        >
                          {counts.subfolderCount > 0
                            ? `${counts.subfolderCount} sub · `
                            : ''}
                          {counts.taskCount} tugasan
                        </Text>
                        <ChevronRight size={14} color={colors.iconMuted} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )
        ) : (
          /* INSIDE A FOLDER: Subfolders + Tasks */
          <>
            {/* Compact Quick Action Bar */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={openCreateFolderModal}
                className="flex-1 h-9 bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 flex-row items-center justify-center gap-1.5"
              >
                <FolderPlus size={14} color={colors.iconStrong} />
                <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Subfolder
                </Text>
              </Pressable>

              <Pressable
                onPress={openCreateTaskModal}
                className="flex-1 h-9 bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg px-3 flex-row items-center justify-center gap-1.5"
              >
                <Plus size={14} color={fabIconColor} />
                <Text className="text-xs font-medium text-white dark:text-[#0A0A0B]">
                  Tugasan Baru
                </Text>
              </Pressable>
            </View>

            {/* Subfolders Grouped List */}
            {childFolders.length > 0 ? (
              <View>
                <View className="flex-row items-center justify-between px-0.5 mb-2">
                  <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Subfolder
                  </Text>
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
                  >
                    {childFolders.length}
                  </Text>
                </View>

                <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
                  {childFolders.map((folder, idx) => {
                    const counts = getFolderCounts(folder.id);
                    return (
                      <Pressable
                        key={folder.id}
                        onPress={() => setCurrentFolderId(folder.id)}
                        className={`py-3 px-4 flex-row items-center justify-between gap-3 ${
                          idx > 0
                            ? 'border-t border-black/5 dark:border-white/5'
                            : ''
                        }`}
                      >
                        <View className="flex-row items-center gap-3 flex-1 min-w-0">
                          <Folder size={16} color={colors.iconStrong} strokeWidth={1.8} />
                          <Text
                            numberOfLines={1}
                            className="text-[13.5px] font-medium text-zinc-900 dark:text-[#F4F4F5] flex-1"
                          >
                            {folder.name}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2 shrink-0">
                          <Text
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-[11.5px] font-mono text-zinc-400 dark:text-zinc-500"
                          >
                            {counts.subfolderCount > 0
                              ? `${counts.subfolderCount} sub · `
                              : ''}
                            {counts.taskCount} tugasan
                          </Text>
                          <ChevronRight size={14} color={colors.iconMuted} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Tasks Grouped List */}
            <View>
              <View className="flex-row items-center justify-between px-0.5 mb-2">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Tugasan
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
                >
                  {currentFolderTasks.length}
                </Text>
              </View>

              {currentFolderTasks.length === 0 ? (
                <View className="bg-white dark:bg-[#141416] rounded-xl p-5 border border-zinc-200/90 dark:border-[#242428] items-center">
                  <Text className="text-[13.5px] font-medium text-zinc-800 dark:text-zinc-200">
                    Belum ada tugasan dalam folder ini
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 text-center">
                    Tekan Tugasan Baru untuk tambah rutin, atau Subfolder untuk susun kategori.
                  </Text>
                </View>
              ) : (
                <View className="bg-white dark:bg-[#141416] rounded-xl border border-zinc-200/90 dark:border-[#242428] overflow-hidden">
                  {currentFolderTasks.map((task, idx) => {
                    const isOnce = task.recurrenceType === 'once';
                    const isDone = isOnce && completedTaskIds.has(task.id);
                    const recurrenceLabel =
                      task.recurrenceType === 'weekly'
                        ? formatDaysOfWeek(task.daysOfWeek)
                        : RECURRENCE_OPTIONS.find(
                            (o) => o.value === task.recurrenceType
                          )?.label ?? task.recurrenceType;

                    return (
                      <View
                        key={task.id}
                        className={`flex-row items-center ${
                          idx > 0
                            ? 'border-t border-black/5 dark:border-white/5'
                            : ''
                        }`}
                      >
                        {isOnce ? (
                          <Pressable
                            onPress={() => toggleTaskDoneToday(task.id)}
                            className="pl-4 pr-2.5 py-3 justify-center"
                            hitSlop={8}
                          >
                            <View
                              className={`w-[17px] h-[17px] rounded-[5px] border items-center justify-center ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {isDone ? (
                                <Check size={11} color="#FFFFFF" strokeWidth={2.6} />
                              ) : null}
                            </View>
                          </Pressable>
                        ) : null}

                        <Pressable
                          onPress={() => openEditTaskModal(task)}
                          className={`flex-1 py-3 pr-4 flex-row items-center justify-between gap-3 ${
                            isOnce ? 'pl-0.5' : 'pl-4'
                          }`}
                        >
                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-2 flex-wrap">
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

                              {isDone ? (
                                <View className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                  <Text className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                    Siap
                                  </Text>
                                </View>
                              ) : (
                                <View className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200/70 dark:border-[#2A2A30]">
                                  <Text className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                    {recurrenceLabel}
                                  </Text>
                                </View>
                              )}
                            </View>

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
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Minimalist Floating Action Button */}
      <Pressable
        onPress={currentFolder ? openCreateTaskModal : openCreateFolderModal}
        className="absolute bottom-[72px] right-4 w-11 h-11 rounded-xl bg-zinc-900 dark:bg-[#F4F4F5] items-center justify-center shadow-lg"
      >
        {currentFolder ? (
          <Plus size={20} color={fabIconColor} />
        ) : (
          <FolderPlus size={18} color={fabIconColor} />
        )}
      </Pressable>

      {/* Modal Tambah / Sunting Folder */}
      <Modal
        visible={folderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#242428] rounded-t-2xl p-5 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                {editingFolderId
                  ? 'Sunting Folder'
                  : currentFolder
                  ? `Subfolder dalam "${currentFolder.name}"`
                  : 'Folder Baru'}
              </Text>
              <Pressable onPress={() => setFolderModalVisible(false)} className="p-1">
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nama Folder
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Cth: Rumah, Kerja, Dapur, Projek A"
              className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-5"
            />

            <View className="gap-2">
              <Pressable
                onPress={handleSaveFolder}
                className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
              >
                <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                  {editingFolderId ? 'Kemaskini Folder' : 'Simpan Folder'}
                </Text>
              </Pressable>

              {editingFolderId ? (
                <Pressable
                  onPress={handleDeleteFolder}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                    Padam Folder &amp; Isinya
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah / Sunting Tugasan */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#141416] border-t border-zinc-200 dark:border-[#242428] rounded-t-2xl p-5 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                {editingTaskId ? 'Sunting Tugasan' : 'Tugasan Baru'}
              </Text>
              <Pressable onPress={() => setTaskModalVisible(false)} className="p-1">
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nama Tugasan
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
              placeholder="Cth: Kemas Dapur / Semak Invois"
              className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-3"
            />

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Penerangan (Pilihan)
            </Text>
            <TextInput
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Tambah nota atau butiran tugasan..."
              className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2.5 text-[13.5px] text-zinc-900 dark:text-[#F4F4F5] mb-3.5 min-h-[68px]"
            />

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Kekerapan
            </Text>
            <View className="flex-row gap-1.5 mb-3.5 flex-wrap">
              {RECURRENCE_OPTIONS.map((opt) => {
                const active = recurrence === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRecurrence(opt.value)}
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

            {recurrence === 'weekly' ? (
              <View className="mb-3.5">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Pilih Hari
                </Text>
                <View className="flex-row gap-1.5 flex-wrap">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const selected = daysOfWeek.includes(day.value);
                    return (
                      <Pressable
                        key={day.value}
                        onPress={() => toggleWeekday(day.value)}
                        className={`px-2.5 py-1.5 rounded-md border ${
                          selected
                            ? 'bg-zinc-900 dark:bg-[#F4F4F5] border-zinc-900 dark:border-[#F4F4F5]'
                            : 'bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#242428]'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            selected
                              ? 'text-white dark:text-[#0A0A0B]'
                              : 'text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Masa Mula (HH:mm)
                </Text>
                <TextInput
                  placeholderTextColor={colors.placeholder}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2 text-[13px] font-mono text-zinc-900 dark:text-[#F4F4F5]"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Masa Tamat (HH:mm)
                </Text>
                <TextInput
                  placeholderTextColor={colors.placeholder}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="09:00"
                  className="bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#242428] rounded-lg px-3 py-2 text-[13px] font-mono text-zinc-900 dark:text-[#F4F4F5]"
                />
              </View>
            </View>

            <View className="gap-2">
              <Pressable
                onPress={handleSaveTask}
                className="bg-zinc-900 dark:bg-[#F4F4F5] rounded-lg py-3 items-center"
              >
                <Text className="text-white dark:text-[#0A0A0B] font-semibold text-[13.5px]">
                  {editingTaskId ? 'Kemaskini Tugasan' : 'Simpan Tugasan'}
                </Text>
              </Pressable>

              {editingTaskId ? (
                <Pressable
                  onPress={() => {
                    deleteTask(editingTaskId);
                    setEditingTaskId(null);
                    setTaskModalVisible(false);
                  }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 flex-row items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text className="text-red-600 dark:text-red-400 font-medium text-[13px]">
                    Padam Tugasan
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
