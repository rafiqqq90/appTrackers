import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { taskCompletions, tasks } from '../db/schema';
import type {
  RecurrenceType,
  Task,
  TaskCompletion,
  TaskCompletionStatus,
} from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';

function mapTaskRow(row: typeof tasks.$inferSelect): Task {
  let daysOfWeek: number[] = [];
  try {
    const parsed = JSON.parse(row.days_of_week);
    if (Array.isArray(parsed)) daysOfWeek = parsed;
  } catch {
    daysOfWeek = [];
  }

  return {
    id: row.id,
    userId: row.user_id,
    folderId: row.folder_id ?? null,
    title: row.title,
    description: row.description,
    recurrenceType: row.recurrence_type as RecurrenceType,
    daysOfWeek,
    startTime: row.start_time,
    endTime: row.end_time,
    remindBeforeMins: row.remind_before_mins,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

function mapCompletionRow(
  row: typeof taskCompletions.$inferSelect
): TaskCompletion {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    scheduledDate: row.scheduled_date,
    status: row.status as TaskCompletionStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

export interface CreateTaskInput {
  userId: string;
  folderId: string | null;
  title: string;
  description?: string | null;
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[];
  startTime?: string | null;
  endTime?: string | null;
  remindBeforeMins?: number;
}

export interface UpdateTaskInput {
  folderId?: string | null;
  title: string;
  description?: string | null;
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[];
  startTime?: string | null;
  endTime?: string | null;
  remindBeforeMins?: number;
  isActive?: boolean;
}

export const taskRepository = {
  getAllActive(userId: string): Task[] {
    const rows = db
      .select()
      .from(tasks)
      .where(and(eq(tasks.user_id, userId), isNull(tasks.deleted_at)))
      .orderBy(asc(tasks.start_time), asc(tasks.created_at))
      .all();

    return rows.map(mapTaskRow);
  },

  create(input: CreateTaskInput): Task {
    const now = nowIsoUtc();
    const id = generateId();
    const record: typeof tasks.$inferInsert = {
      id,
      user_id: input.userId,
      folder_id: input.folderId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      recurrence_type: input.recurrenceType,
      days_of_week: JSON.stringify(input.daysOfWeek ?? []),
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      remind_before_mins: input.remindBeforeMins ?? 0,
      is_active: 1,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      is_synced: 0,
    };

    db.insert(tasks).values(record).run();

    return mapTaskRow({
      ...record,
      folder_id: record.folder_id ?? null,
      description: record.description ?? null,
      start_time: record.start_time ?? null,
      end_time: record.end_time ?? null,
      remind_before_mins: record.remind_before_mins ?? 0,
      is_active: record.is_active ?? 1,
      deleted_at: null,
      is_synced: 0,
      days_of_week: record.days_of_week ?? '[]',
      recurrence_type: record.recurrence_type ?? 'daily',
    });
  },

  update(id: string, input: UpdateTaskInput): void {
    const now = nowIsoUtc();
    db.update(tasks)
      .set({
        ...(input.folderId !== undefined ? { folder_id: input.folderId } : {}),
        title: input.title.trim(),
        description: input.description?.trim() || null,
        recurrence_type: input.recurrenceType,
        days_of_week: JSON.stringify(input.daysOfWeek ?? []),
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        remind_before_mins: input.remindBeforeMins ?? 0,
        ...(typeof input.isActive === 'boolean'
          ? { is_active: input.isActive ? 1 : 0 }
          : {}),
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(tasks.id, id))
      .run();
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    db.update(tasks)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(tasks.id, id))
      .run();
  },

  getCompletionsForDate(userId: string, scheduledDate: string): TaskCompletion[] {
    const rows = db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.user_id, userId),
          eq(taskCompletions.scheduled_date, scheduledDate),
          isNull(taskCompletions.deleted_at)
        )
      )
      .all();

    return rows.map(mapCompletionRow);
  },

  toggleCompletion(
    userId: string,
    taskId: string,
    scheduledDate: string,
    status: TaskCompletionStatus = 'completed'
  ): void {
    const now = nowIsoUtc();
    const existing = db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.user_id, userId),
          eq(taskCompletions.task_id, taskId),
          eq(taskCompletions.scheduled_date, scheduledDate),
          isNull(taskCompletions.deleted_at)
        )
      )
      .get();

    if (existing) {
      db.update(taskCompletions)
        .set({
          deleted_at: now,
          updated_at: now,
          is_synced: 0,
        })
        .where(eq(taskCompletions.id, existing.id))
        .run();
      return;
    }

    db.insert(taskCompletions)
      .values({
        id: generateId(),
        user_id: userId,
        task_id: taskId,
        scheduled_date: scheduledDate,
        status,
        completed_at: status === 'completed' ? now : null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_synced: 0,
      })
      .run();
  },
};
