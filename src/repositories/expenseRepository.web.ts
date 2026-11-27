import type { Expense } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from './expenseRepository';

const STORAGE_KEY = 'myrutin_expenses';

function readList(): Expense[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

function writeList(data: Expense[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export const expenseRepository = {
  getAll(userId: string): Expense[] {
    return readList()
      .filter((e) => e.userId === userId && !e.deletedAt)
      .map((e) => ({
        ...e,
        isPaid: typeof e.isPaid === 'boolean' ? e.isPaid : true,
        dueDate: e.dueDate ?? null,
        dueTime: e.dueTime ?? null,
      }))
      .sort(
        (a, b) =>
          b.expenseDate.localeCompare(a.expenseDate) ||
          b.createdAt.localeCompare(a.createdAt)
      );
  },

  create(input: CreateExpenseInput): Expense {
    const now = nowIsoUtc();
    const record: Expense = {
      id: generateId(),
      userId: input.userId,
      itemName: input.itemName.trim(),
      amount: input.amount,
      currency: input.currency ?? 'MYR',
      category: input.category.trim() || 'Lain-lain',
      expenseDate: input.expenseDate,
      isPaid: input.isPaid ?? true,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      receiptUri: input.receiptUri ?? null,
      receiptName: input.receiptName ?? null,
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

  update(id: string, input: UpdateExpenseInput): void {
    const now = nowIsoUtc();
    const all = readList().map((e) =>
      e.id === id
        ? {
            ...e,
            itemName: input.itemName.trim(),
            amount: input.amount,
            currency: input.currency ?? 'MYR',
            category: input.category.trim() || 'Lain-lain',
            expenseDate: input.expenseDate,
            isPaid: input.isPaid ?? true,
            dueDate: input.dueDate ?? null,
            dueTime: input.dueTime ?? null,
            receiptUri: input.receiptUri ?? null,
            receiptName: input.receiptName ?? null,
            updatedAt: now,
            isSynced: false,
          }
        : e
    );
    writeList(all);
  },

  togglePaid(id: string): void {
    const now = nowIsoUtc();
    const all = readList().map((e) =>
      e.id === id
        ? {
            ...e,
            isPaid: !(typeof e.isPaid === 'boolean' ? e.isPaid : true),
            updatedAt: now,
            isSynced: false,
          }
        : e
    );
    writeList(all);
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    const all = readList().map((e) =>
      e.id === id
        ? { ...e, deletedAt: now, updatedAt: now, isSynced: false }
        : e
    );
    writeList(all);
  },
};
