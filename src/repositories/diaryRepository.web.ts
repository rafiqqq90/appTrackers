import type { DiaryEntry } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';
import type { CreateDiaryInput, UpdateDiaryInput } from './diaryRepository';

const DIARY_KEY = 'myrutin_diary_entries';

function readList(): DiaryEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(DIARY_KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeList(data: DiaryEntry[]): void {
  try {
    globalThis.localStorage?.setItem(DIARY_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const diaryRepository = {
  getAll(userId: string): DiaryEntry[] {
    return readList()
      .filter((d) => d.userId === userId && !d.deletedAt)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.updatedAt.localeCompare(a.updatedAt));
  },

  create(input: CreateDiaryInput): DiaryEntry {
    const now = nowIsoUtc();
    const record: DiaryEntry = {
      id: generateId(),
      userId: input.userId,
      entryDate: input.entryDate,
      title: input.title.trim(),
      content: input.content,
      mood: input.mood ?? null,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };

    const all = readList();
    all.push(record);
    writeList(all);
    return record;
  },

  update(id: string, input: UpdateDiaryInput): void {
    const now = nowIsoUtc();
    const all = readList().map((d) =>
      d.id === id
        ? {
            ...d,
            entryDate: input.entryDate,
            title: input.title.trim(),
            content: input.content,
            mood: input.mood ?? null,
            tags: input.tags ?? [],
            updatedAt: now,
            isSynced: false,
          }
        : d
    );
    writeList(all);
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    const all = readList().map((d) =>
      d.id === id ? { ...d, deletedAt: now, updatedAt: now, isSynced: false } : d
    );
    writeList(all);
  },
};
