import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * 0. Jadual task_folders (menyokong folder & subfolder bertingkat)
 */
export const taskFolders = sqliteTable('task_folders', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  parent_id: text('parent_id'),
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 1. Jadual tasks (SQLite local mirror of PostgreSQL public.tasks)
 */
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  folder_id: text('folder_id'),
  title: text('title').notNull(),
  description: text('description'),
  recurrence_type: text('recurrence_type').notNull().default('once'),
  days_of_week: text('days_of_week').notNull().default('[]'),
  start_time: text('start_time'),
  end_time: text('end_time'),
  remind_before_mins: integer('remind_before_mins').notNull().default(0),
  is_active: integer('is_active').notNull().default(1),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 2. Jadual task_completions
 */
export const taskCompletions = sqliteTable('task_completions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  task_id: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  scheduled_date: text('scheduled_date').notNull(),
  status: text('status').notNull(), // 'completed' | 'skipped'
  completed_at: text('completed_at'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 3. Jadual subscriptions
 */
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  service_name: text('service_name').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('MYR'),
  billing_cycle: text('billing_cycle').notNull().default('monthly'),
  next_billing_date: text('next_billing_date').notNull(),
  alert_days_before: text('alert_days_before').notNull().default('[7,3,1]'),
  payment_method: text('payment_method'),
  status: text('status').notNull().default('active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 3b. Jadual expenses (Senarai Perbelanjaan)
 */
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  item_name: text('item_name').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('MYR'),
  category: text('category').notNull().default('Lain-lain'),
  expense_date: text('expense_date').notNull(),
  is_paid: integer('is_paid').notNull().default(1),
  due_date: text('due_date'),
  due_time: text('due_time'),
  receipt_uri: text('receipt_uri'),
  receipt_name: text('receipt_name'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 4. Jadual diary_entries
 */
export const diaryEntries = sqliteTable('diary_entries', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  entry_date: text('entry_date').notNull(),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  mood: text('mood'),
  tags: text('tags').notNull().default('[]'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
  is_synced: integer('is_synced').notNull().default(0),
});

/**
 * 5. Jadual Tempatan sync_metadata (SQLite sahaja)
 */
export const syncMetadata = sqliteTable('sync_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
