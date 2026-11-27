import type { Task, TaskFolder } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';
import type {
  CreateTaskFolderInput,
  UpdateTaskFolderInput,
} from './taskFolderRepository';

const FOLDERS_KEY = 'myrutin_task_folders';
const TASKS_KEY = 'myrutin_tasks';

function readList<T>(key: string): T[] {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, data: T[]): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const taskFolderRepository = {
  getAll(userId: string): TaskFolder[] {
    return readList<TaskFolder>(FOLDERS_KEY)
      .filter((f) => f.userId === userId && !f.deletedAt)
      .map((f) => ({ ...f, sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : 0 }))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });
  },

  create(input: CreateTaskFolderInput): TaskFolder {
    const now = nowIsoUtc();
    const parentId = input.parentId ?? null;
    const all = readList<TaskFolder>(FOLDERS_KEY);
    const siblings = all.filter(
      (f) => f.userId === input.userId && !f.deletedAt && (f.parentId ?? null) === parentId
    );
    const nextSortOrder =
      siblings.length > 0
        ? Math.max(...siblings.map((s, idx) => (typeof s.sortOrder === 'number' ? s.sortOrder : idx))) + 1
        : 0;

    const record: TaskFolder = {
      id: generateId(),
      userId: input.userId,
      parentId,
      name: input.name.trim(),
      sortOrder: nextSortOrder,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };

    all.push(record);
    writeList(FOLDERS_KEY, all);
    return record;
  },

  update(id: string, input: UpdateTaskFolderInput): void {
    const now = nowIsoUtc();
    const all = readList<TaskFolder>(FOLDERS_KEY).map((f) =>
      f.id === id
        ? { ...f, name: input.name.trim(), updatedAt: now, isSynced: false }
        : f
    );
    writeList(FOLDERS_KEY, all);
  },

  reorder(orderedIds: string[]): void {
    const now = nowIsoUtc();
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => orderMap.set(id, idx));

    const all = readList<TaskFolder>(FOLDERS_KEY).map((f) => {
      const nextOrder = orderMap.get(f.id);
      if (nextOrder === undefined) return f;
      return {
        ...f,
        sortOrder: nextOrder,
        updatedAt: now,
        isSynced: false,
      };
    });
    writeList(FOLDERS_KEY, all);
  },

  softDeleteCascade(userId: string, folderId: string): void {
    const now = nowIsoUtc();
    const allFolders = readList<TaskFolder>(FOLDERS_KEY);
    const activeUserFolders = allFolders.filter(
      (f) => f.userId === userId && !f.deletedAt
    );

    const idsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of activeUserFolders) {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          added = true;
        }
      }
    }

    const updatedFolders = allFolders.map((f) =>
      idsToDelete.has(f.id)
        ? { ...f, deletedAt: now, updatedAt: now, isSynced: false }
        : f
    );
    writeList(FOLDERS_KEY, updatedFolders);

    const updatedTasks = readList<Task>(TASKS_KEY).map((t) =>
      t.folderId && idsToDelete.has(t.folderId)
        ? { ...t, deletedAt: now, updatedAt: now, isSynced: false }
        : t
    );
    writeList(TASKS_KEY, updatedTasks);
  },
};
