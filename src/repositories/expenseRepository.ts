import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { expenses } from '../db/schema';
import type { Expense } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';

function mapExpenseRow(row: typeof expenses.$inferSelect): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    itemName: row.item_name,
    amount: row.amount,
    currency: row.currency,
    category: row.category,
    expenseDate: row.expense_date,
    isPaid: (row.is_paid ?? 1) === 1,
    dueDate: row.due_date ?? null,
    dueTime: row.due_time ?? null,
    receiptUri: row.receipt_uri ?? null,
    receiptName: row.receipt_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

export interface CreateExpenseInput {
  userId: string;
  itemName: string;
  amount: number;
  currency?: string;
  category: string;
  expenseDate: string;
  isPaid?: boolean;
  dueDate?: string | null;
  dueTime?: string | null;
  receiptUri?: string | null;
  receiptName?: string | null;
}

export interface UpdateExpenseInput {
  itemName: string;
  amount: number;
  currency?: string;
  category: string;
  expenseDate: string;
  isPaid?: boolean;
  dueDate?: string | null;
  dueTime?: string | null;
  receiptUri?: string | null;
  receiptName?: string | null;
}

export const expenseRepository = {
  getAll(userId: string): Expense[] {
    const rows = db
      .select()
      .from(expenses)
      .where(and(eq(expenses.user_id, userId), isNull(expenses.deleted_at)))
      .orderBy(desc(expenses.expense_date), desc(expenses.created_at))
      .all();

    return rows.map(mapExpenseRow);
  },

  create(input: CreateExpenseInput): Expense {
    const now = nowIsoUtc();
    const id = generateId();
    const currency = input.currency ?? 'MYR';
    const isPaid = input.isPaid ?? true;
    const dueDate = input.dueDate ?? null;
    const dueTime = input.dueTime ?? null;
    const receiptUri = input.receiptUri ?? null;
    const receiptName = input.receiptName ?? null;

    db.insert(expenses)
      .values({
        id,
        user_id: input.userId,
        item_name: input.itemName.trim(),
        amount: input.amount,
        currency,
        category: input.category.trim() || 'Lain-lain',
        expense_date: input.expenseDate,
        is_paid: isPaid ? 1 : 0,
        due_date: dueDate,
        due_time: dueTime,
        receipt_uri: receiptUri,
        receipt_name: receiptName,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_synced: 0,
      })
      .run();

    return {
      id,
      userId: input.userId,
      itemName: input.itemName.trim(),
      amount: input.amount,
      currency,
      category: input.category.trim() || 'Lain-lain',
      expenseDate: input.expenseDate,
      isPaid,
      dueDate,
      dueTime,
      receiptUri,
      receiptName,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };
  },

  update(id: string, input: UpdateExpenseInput): void {
    const now = nowIsoUtc();
    db.update(expenses)
      .set({
        item_name: input.itemName.trim(),
        amount: input.amount,
        currency: input.currency ?? 'MYR',
        category: input.category.trim() || 'Lain-lain',
        expense_date: input.expenseDate,
        is_paid: (input.isPaid ?? true) ? 1 : 0,
        due_date: input.dueDate ?? null,
        due_time: input.dueTime ?? null,
        receipt_uri: input.receiptUri ?? null,
        receipt_name: input.receiptName ?? null,
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(expenses.id, id))
      .run();
  },

  togglePaid(id: string): void {
    const existing = db.select().from(expenses).where(eq(expenses.id, id)).get();
    if (!existing) return;
    const nextPaid = existing.is_paid === 1 ? 0 : 1;
    db.update(expenses)
      .set({
        is_paid: nextPaid,
        updated_at: nowIsoUtc(),
        is_synced: 0,
      })
      .where(eq(expenses.id, id))
      .run();
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    db.update(expenses)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(expenses.id, id))
      .run();
  },
};
