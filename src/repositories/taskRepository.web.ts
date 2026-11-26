import type {
  Task,
  TaskCompletion,
  TaskCompletionStatus,
} from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';
import type { CreateTaskInput, UpdateTaskInput } from './taskRepository';

const TASKS_KEY = 'myrutin_tasks';
const COMPLETIONS_KEY = 'myrutin_task_completions';

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
    // ignore quota errors in preview
  }
}

export const taskRepository = {
  getAllActive(userId: string): Task[] {
    return readList<Task>(TASKS_KEY)
      .filter((t) => t.userId === userId && !t.deletedAt)
      .map((t) => ({ ...t, folderId: t.folderId ?? null }))
      .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
  },

  create(input: CreateTaskInput): Task {
    const now = nowIsoUtc();
    const record: Task = {
      id: generateId(),
      userId: input.userId,
      folderId: input.folderId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      recurrenceType: input.recurrenceType,
      daysOfWeek: input.daysOfWeek ?? [],
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      remindBeforeMins: input.remindBeforeMins ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };

    const all = readList<Task>(TASKS_KEY);
    all.push(record);
    writeList(TASKS_KEY, all);
    return record;
  },

  update(id: string, input: UpdateTaskInput): void {
    const now = nowIsoUtc();
    const all = readList<Task>(TASKS_KEY).map((t) =>
      t.id === id
        ? {
            ...t,
            folderId:
              input.folderId !== undefined ? input.folderId : (t.folderId ?? null),
            title: input.title.trim(),
            description: input.description?.trim() || null,
            recurrenceType: input.recurrenceType,
            daysOfWeek: input.daysOfWeek ?? [],
            startTime: input.startTime ?? null,
            endTime: input.endTime ?? null,
            remindBeforeMins: input.remindBeforeMins ?? t.remindBeforeMins,
            isActive:
              typeof input.isActive === 'boolean' ? input.isActive : t.isActive,
            updatedAt: now,
            isSynced: false,
          }
        : t
    );
    writeList(TASKS_KEY, all);
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    const all = readList<Task>(TASKS_KEY).map((t) =>
      t.id === id ? { ...t, deletedAt: now, updatedAt: now, isSynced: false } : t
    );
    writeList(TASKS_KEY, all);
  },

  getCompletionsForDate(userId: string, scheduledDate: string): TaskCompletion[] {
    return readList<TaskCompletion>(COMPLETIONS_KEY).filter(
      (c) =>
        c.userId === userId &&
        c.scheduledDate === scheduledDate &&
        !c.deletedAt
    );
  },

  toggleCompletion(
    userId: string,
    taskId: string,
    scheduledDate: string,
    status: TaskCompletionStatus = 'completed'
  ): void {
    const now = nowIsoUtc();
    const all = readList<TaskCompletion>(COMPLETIONS_KEY);
    const idx = all.findIndex(
      (c) =>
        c.userId === userId &&
        c.taskId === taskId &&
        c.scheduledDate === scheduledDate &&
        !c.deletedAt
    );

    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        deletedAt: now,
        updatedAt: now,
        isSynced: false,
      };
      writeList(COMPLETIONS_KEY, all);
      return;
    }

    all.push({
      id: generateId(),
      userId,
      taskId,
      scheduledDate,
      status,
      completedAt: status === 'completed' ? now : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    });
    writeList(COMPLETIONS_KEY, all);
  },
};
