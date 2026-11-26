import type { Subscription } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from './subscriptionRepository';

const SUBS_KEY = 'myrutin_subscriptions';

function readList(): Subscription[] {
  try {
    const raw = globalThis.localStorage?.getItem(SUBS_KEY);
    return raw ? (JSON.parse(raw) as Subscription[]) : [];
  } catch {
    return [];
  }
}

function writeList(data: Subscription[]): void {
  try {
    globalThis.localStorage?.setItem(SUBS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const subscriptionRepository = {
  getAll(userId: string): Subscription[] {
    return readList()
      .filter((s) => s.userId === userId && !s.deletedAt)
      .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  },

  create(input: CreateSubscriptionInput): Subscription {
    const now = nowIsoUtc();
    const record: Subscription = {
      id: generateId(),
      userId: input.userId,
      serviceName: input.serviceName.trim(),
      amount: input.amount,
      currency: input.currency ?? 'MYR',
      billingCycle: input.billingCycle,
      nextBillingDate: input.nextBillingDate,
      alertDaysBefore: input.alertDaysBefore ?? [7, 3, 1],
      paymentMethod: input.paymentMethod?.trim() || null,
      status: 'active',
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

  update(id: string, input: UpdateSubscriptionInput): void {
    const now = nowIsoUtc();
    const all = readList().map((s) =>
      s.id === id
        ? {
            ...s,
            serviceName: input.serviceName.trim(),
            amount: input.amount,
            currency: input.currency ?? s.currency,
            billingCycle: input.billingCycle,
            nextBillingDate: input.nextBillingDate,
            alertDaysBefore: input.alertDaysBefore ?? s.alertDaysBefore,
            paymentMethod: input.paymentMethod?.trim() || null,
            status: input.status ?? s.status,
            updatedAt: now,
            isSynced: false,
          }
        : s
    );
    writeList(all);
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    const all = readList().map((s) =>
      s.id === id ? { ...s, deletedAt: now, updatedAt: now, isSynced: false } : s
    );
    writeList(all);
  },
};
