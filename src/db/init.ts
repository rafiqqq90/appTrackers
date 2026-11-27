import { sqlite } from './client';

let initialized = false;

/**
 * Bootstraps the local SQLite database with WAL mode, foreign keys,
 * all PRD tables, and indexes for fast offline queries (<50ms).
 */
export function initializeDatabase(): void {
  if (initialized) return;

  sqlite.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS task_folders (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      folder_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      recurrence_type TEXT NOT NULL DEFAULT 'once',
      days_of_week TEXT NOT NULL DEFAULT '[]',
      start_time TEXT,
      end_time TEXT,
      remind_before_mins INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'MYR',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      next_billing_date TEXT NOT NULL,
      alert_days_before TEXT NOT NULL DEFAULT '[7,3,1]',
      payment_method TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'MYR',
      category TEXT NOT NULL DEFAULT 'Lain-lain',
      expense_date TEXT NOT NULL,
      is_paid INTEGER NOT NULL DEFAULT 1,
      due_date TEXT,
      due_time TEXT,
      receipt_uri TEXT,
      receipt_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS diary_entries (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      mood TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_folders_user ON task_folders(user_id, parent_id);
    CREATE INDEX IF NOT EXISTS idx_folders_sync ON task_folders(is_synced, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_sync ON tasks(is_synced, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_tasks_folder ON tasks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(scheduled_date, task_id);
    CREATE INDEX IF NOT EXISTS idx_completions_sync ON task_completions(is_synced, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_subs_billing ON subscriptions(next_billing_date, status);
    CREATE INDEX IF NOT EXISTS idx_subs_sync ON subscriptions(is_synced, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date, user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_sync ON expenses(is_synced, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_diary_sync ON diary_entries(is_synced, deleted_at);
  `);

  // Safe migration for existing local SQLite databases created before folder_id / sort_order existed
  try {
    sqlite.execSync(`ALTER TABLE tasks ADD COLUMN folder_id TEXT;`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.execSync(`ALTER TABLE task_folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.execSync(`ALTER TABLE expenses ADD COLUMN is_paid INTEGER NOT NULL DEFAULT 1;`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.execSync(`ALTER TABLE expenses ADD COLUMN due_date TEXT;`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.execSync(`ALTER TABLE expenses ADD COLUMN due_time TEXT;`);
  } catch {
    // Column already exists
  }

  initialized = true;
}
