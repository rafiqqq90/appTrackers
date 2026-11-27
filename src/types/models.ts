export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type TaskCompletionStatus = 'completed' | 'skipped';

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type DiaryMood = 'productive' | 'happy' | 'calm' | 'tired';

export type SyncState = 'synced' | 'syncing' | 'offline';

export interface TaskFolder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}

export interface Task {
  id: string;
  userId: string;
  folderId: string | null;
  title: string;
  description: string | null;
  recurrenceType: RecurrenceType;
  /** Array of weekday numbers (0=Sun..6=Sat or 1=Mon..7=Sun; we use 1=Isnin..7=Ahad consistently) */
  daysOfWeek: number[];
  /** HH:mm e.g. "08:00" */
  startTime: string | null;
  /** HH:mm e.g. "10:00" */
  endTime: string | null;
  remindBeforeMins: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  /** YYYY-MM-DD */
  scheduledDate: string;
  status: TaskCompletionStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  /** YYYY-MM-DD */
  nextBillingDate: string;
  alertDaysBefore: number[];
  paymentMethod: string | null;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  itemName: string;
  amount: number;
  currency: string;
  category: string;
  /** YYYY-MM-DD */
  expenseDate: string;
  /** True when already paid; false when scheduled to be paid later */
  isPaid: boolean;
  /** Scheduled payment date YYYY-MM-DD (alerts on Hari Ini 3 days prior) */
  dueDate: string | null;
  /** Optional scheduled payment time HH:mm */
  dueTime: string | null;
  receiptUri: string | null;
  receiptName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  /** YYYY-MM-DD */
  entryDate: string;
  title: string;
  content: string;
  mood: DiaryMood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
}
