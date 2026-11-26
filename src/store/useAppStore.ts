import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { initializeDatabase } from '../db/init';
import {
  diaryRepository,
  type CreateDiaryInput,
  type UpdateDiaryInput,
} from '../repositories/diaryRepository';
import {
  subscriptionRepository,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
} from '../repositories/subscriptionRepository';
import {
  taskFolderRepository,
  type CreateTaskFolderInput,
  type UpdateTaskFolderInput,
} from '../repositories/taskFolderRepository';
import {
  taskRepository,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../repositories/taskRepository';
import { syncService } from '../services/syncService';
import type {
  DiaryEntry,
  Subscription,
  SyncState,
  Task,
  TaskCompletion,
  TaskFolder,
} from '../types/models';
import { getLocalDateString } from '../utils/id';

// Local user UUID placeholder until Supabase Auth is wired in Week 4
const LOCAL_DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000001';

interface AppStoreState {
  isReady: boolean;
  userId: string;
  isOnline: boolean;
  syncState: SyncState;
  lastSyncedAt: string | null;

  taskFolders: TaskFolder[];
  tasks: Task[];
  todayCompletions: TaskCompletion[];
  subscriptions: Subscription[];
  diaryEntries: DiaryEntry[];

  bootstrap: () => void;
  refreshAll: () => void;
  startNetworkListener: () => () => void;
  triggerSync: () => Promise<void>;

  addTaskFolder: (input: Omit<CreateTaskFolderInput, 'userId'>) => void;
  updateTaskFolder: (id: string, input: UpdateTaskFolderInput) => void;
  deleteTaskFolder: (id: string) => void;

  addTask: (input: Omit<CreateTaskInput, 'userId'>) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  toggleTaskDoneToday: (taskId: string) => void;

  addSubscription: (input: Omit<CreateSubscriptionInput, 'userId'>) => void;
  updateSubscription: (id: string, input: UpdateSubscriptionInput) => void;
  deleteSubscription: (id: string) => void;

  addDiaryEntry: (input: Omit<CreateDiaryInput, 'userId'>) => void;
  updateDiaryEntry: (id: string, input: UpdateDiaryInput) => void;
  deleteDiaryEntry: (id: string) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  isReady: false,
  userId: LOCAL_DEFAULT_USER_ID,
  isOnline: true,
  syncState: 'synced',
  lastSyncedAt: null,

  taskFolders: [],
  tasks: [],
  todayCompletions: [],
  subscriptions: [],
  diaryEntries: [],

  bootstrap: () => {
    initializeDatabase();
    get().refreshAll();
    set({ isReady: true });
  },

  refreshAll: () => {
    const { userId } = get();
    const today = getLocalDateString();
    set({
      taskFolders: taskFolderRepository.getAll(userId),
      tasks: taskRepository.getAllActive(userId),
      todayCompletions: taskRepository.getCompletionsForDate(userId, today),
      subscriptions: subscriptionRepository.getAll(userId),
      diaryEntries: diaryRepository.getAll(userId),
    });
  },

  startNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOffline = !get().isOnline;
      set({
        isOnline: online,
        syncState: online ? 'synced' : 'offline',
      });

      if (online && wasOffline) {
        void get().triggerSync();
      }
    });
    return unsubscribe;
  },

  triggerSync: async () => {
    if (!get().isOnline) {
      set({ syncState: 'offline' });
      return;
    }

    set({ syncState: 'syncing' });
    try {
      const result = await syncService.runDeltaSync();
      set({
        syncState: 'synced',
        lastSyncedAt: result.syncedAt,
      });
    } catch {
      set({ syncState: get().isOnline ? 'synced' : 'offline' });
    }
  },

  addTaskFolder: (input) => {
    const { userId, isOnline } = get();
    taskFolderRepository.create({ ...input, userId });
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  updateTaskFolder: (id, input) => {
    taskFolderRepository.update(id, input);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  deleteTaskFolder: (id) => {
    const { userId, isOnline } = get();
    taskFolderRepository.softDeleteCascade(userId, id);
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  addTask: (input) => {
    const { userId, isOnline } = get();
    taskRepository.create({ ...input, userId });
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  updateTask: (id, input) => {
    taskRepository.update(id, input);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  deleteTask: (id) => {
    taskRepository.softDelete(id);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  toggleTaskDoneToday: (taskId) => {
    const { userId, isOnline } = get();
    taskRepository.toggleCompletion(userId, taskId, getLocalDateString(), 'completed');
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  addSubscription: (input) => {
    const { userId, isOnline } = get();
    subscriptionRepository.create({ ...input, userId });
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  updateSubscription: (id, input) => {
    subscriptionRepository.update(id, input);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  deleteSubscription: (id) => {
    subscriptionRepository.softDelete(id);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  addDiaryEntry: (input) => {
    const { userId, isOnline } = get();
    diaryRepository.create({ ...input, userId });
    get().refreshAll();
    if (isOnline) void get().triggerSync();
  },

  updateDiaryEntry: (id, input) => {
    diaryRepository.update(id, input);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },

  deleteDiaryEntry: (id) => {
    diaryRepository.softDelete(id);
    get().refreshAll();
    if (get().isOnline) void get().triggerSync();
  },
}));
