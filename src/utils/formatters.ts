import type { BillingCycle, Subscription, Task } from '../types/models';
import { getIsoWeekday } from './id';

const DAY_LABELS: Record<number, string> = {
  1: 'Isn',
  2: 'Sel',
  3: 'Rab',
  4: 'Kha',
  5: 'Jum',
  6: 'Sab',
  7: 'Aha',
};

export function formatDaysOfWeek(days: number[]): string {
  if (!days.length) return 'Setiap hari';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? String(d))
    .join(', ');
}

export function isTaskScheduledForDate(task: Task, date: Date = new Date()): boolean {
  if (!task.isActive) return false;
  if (task.recurrenceType === 'daily' || task.recurrenceType === 'once') {
    return true;
  }
  if (task.daysOfWeek.length === 0) return true;
  const weekday = getIsoWeekday(date);
  return task.daysOfWeek.includes(weekday);
}

export function normalizeMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
}

export function calculateSubscriptionTotals(subs: Subscription[]): {
  monthlyTotal: number;
  yearlyTotal: number;
} {
  const activeSubs = subs.filter((s) => s.status === 'active');
  const monthlyTotal = activeSubs.reduce(
    (sum, s) => sum + normalizeMonthlyAmount(s.amount, s.billingCycle),
    0
  );
  return {
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
  };
}

/**
 * Converts stored ISO date (YYYY-MM-DD) or legacy DD-MM-YYYY to system-wide DD/MM/YYYY.
 */
export function formatDisplayDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
}

/**
 * Formats an ISO timestamp into DD/MM/YYYY HH:mm.
 */
export function formatDisplayDateTime(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return isoTimestamp;
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const y = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

/**
 * Converts user-entered DD-MM-YYYY (or YYYY-MM-DD) to ISO YYYY-MM-DD for SQLite/PostgreSQL storage.
 */
export function parseDisplayDateToIso(input: string): string | null {
  const trimmed = input.trim();
  const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return trimmed;
  }
  return null;
}

export function daysUntilDate(dateStr: string): number {
  const iso = parseDisplayDateToIso(dateStr) ?? dateStr;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return 999;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  const prefix = currency === 'MYR' ? 'RM' : currency;
  return `${prefix} ${amount.toFixed(2)}`;
}
