import * as Crypto from 'expo-crypto';

/**
 * Generates a client-side UUID v4 for offline-first local-write records.
 */
export function generateId(): string {
  return Crypto.randomUUID();
}

/**
 * Returns current UTC timestamp in ISO-8601 format for Delta Sync (LWW).
 */
export function nowIsoUtc(): string {
  return new Date().toISOString();
}

/**
 * Returns local calendar date formatted as YYYY-MM-DD.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns weekday index using ISO-8601 convention: 1 = Isnin (Mon) ... 7 = Ahad (Sun).
 */
export function getIsoWeekday(date: Date = new Date()): number {
  const jsDay = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return jsDay === 0 ? 7 : jsDay;
}
