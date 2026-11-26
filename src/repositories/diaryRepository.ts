import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { diaryEntries } from '../db/schema';
import type { DiaryEntry, DiaryMood } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';

function mapDiaryRow(row: typeof diaryEntries.$inferSelect): DiaryEntry {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    title: row.title,
    content: row.content,
    mood: (row.mood as DiaryMood | null) ?? null,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

export interface CreateDiaryInput {
  userId: string;
  entryDate: string;
  title: string;
  content: string;
  mood?: DiaryMood | null;
  tags?: string[];
}

export interface UpdateDiaryInput {
  entryDate: string;
  title: string;
  content: string;
  mood?: DiaryMood | null;
  tags?: string[];
}

export const diaryRepository = {
  getAll(userId: string): DiaryEntry[] {
    const rows = db
      .select()
      .from(diaryEntries)
      .where(
        and(eq(diaryEntries.user_id, userId), isNull(diaryEntries.deleted_at))
      )
      .orderBy(desc(diaryEntries.entry_date), desc(diaryEntries.updated_at))
      .all();

    return rows.map(mapDiaryRow);
  },

  create(input: CreateDiaryInput): DiaryEntry {
    const now = nowIsoUtc();
    const id = generateId();
    const tags = input.tags ?? [];

    db.insert(diaryEntries)
      .values({
        id,
        user_id: input.userId,
        entry_date: input.entryDate,
        title: input.title.trim(),
        content: input.content,
        mood: input.mood ?? null,
        tags: JSON.stringify(tags),
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_synced: 0,
      })
      .run();

    return {
      id,
      userId: input.userId,
      entryDate: input.entryDate,
      title: input.title.trim(),
      content: input.content,
      mood: input.mood ?? null,
      tags,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };
  },

  update(id: string, input: UpdateDiaryInput): void {
    const now = nowIsoUtc();
    db.update(diaryEntries)
      .set({
        entry_date: input.entryDate,
        title: input.title.trim(),
        content: input.content,
        mood: input.mood ?? null,
        tags: JSON.stringify(input.tags ?? []),
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(diaryEntries.id, id))
      .run();
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    db.update(diaryEntries)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(diaryEntries.id, id))
      .run();
  },
};
