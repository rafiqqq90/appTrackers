import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { subscriptions } from '../db/schema';
import type {
  BillingCycle,
  Subscription,
  SubscriptionStatus,
} from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';

function mapSubscriptionRow(
  row: typeof subscriptions.$inferSelect
): Subscription {
  let alertDaysBefore: number[] = [7, 3, 1];
  try {
    const parsed = JSON.parse(row.alert_days_before);
    if (Array.isArray(parsed)) alertDaysBefore = parsed;
  } catch {
    alertDaysBefore = [7, 3, 1];
  }

  return {
    id: row.id,
    userId: row.user_id,
    serviceName: row.service_name,
    amount: row.amount,
    currency: row.currency,
    billingCycle: row.billing_cycle as BillingCycle,
    nextBillingDate: row.next_billing_date,
    alertDaysBefore,
    paymentMethod: row.payment_method,
    status: row.status as SubscriptionStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

export interface CreateSubscriptionInput {
  userId: string;
  serviceName: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  alertDaysBefore?: number[];
  paymentMethod?: string | null;
}

export interface UpdateSubscriptionInput {
  serviceName: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  alertDaysBefore?: number[];
  paymentMethod?: string | null;
  status?: SubscriptionStatus;
}

export const subscriptionRepository = {
  getAll(userId: string): Subscription[] {
    const rows = db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.user_id, userId), isNull(subscriptions.deleted_at))
      )
      .orderBy(asc(subscriptions.next_billing_date))
      .all();

    return rows.map(mapSubscriptionRow);
  },

  create(input: CreateSubscriptionInput): Subscription {
    const now = nowIsoUtc();
    const id = generateId();
    const alertDays = input.alertDaysBefore ?? [7, 3, 1];
    const currency = input.currency ?? 'MYR';

    db.insert(subscriptions)
      .values({
        id,
        user_id: input.userId,
        service_name: input.serviceName.trim(),
        amount: input.amount,
        currency,
        billing_cycle: input.billingCycle,
        next_billing_date: input.nextBillingDate,
        alert_days_before: JSON.stringify(alertDays),
        payment_method: input.paymentMethod?.trim() || null,
        status: 'active',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_synced: 0,
      })
      .run();

    return {
      id,
      userId: input.userId,
      serviceName: input.serviceName.trim(),
      amount: input.amount,
      currency,
      billingCycle: input.billingCycle,
      nextBillingDate: input.nextBillingDate,
      alertDaysBefore: alertDays,
      paymentMethod: input.paymentMethod?.trim() || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };
  },

  update(id: string, input: UpdateSubscriptionInput): void {
    const now = nowIsoUtc();
    db.update(subscriptions)
      .set({
        service_name: input.serviceName.trim(),
        amount: input.amount,
        currency: input.currency ?? 'MYR',
        billing_cycle: input.billingCycle,
        next_billing_date: input.nextBillingDate,
        alert_days_before: JSON.stringify(input.alertDaysBefore ?? [7, 3, 1]),
        payment_method: input.paymentMethod?.trim() || null,
        status: input.status ?? 'active',
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(subscriptions.id, id))
      .run();
  },

  softDelete(id: string): void {
    const now = nowIsoUtc();
    db.update(subscriptions)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(subscriptions.id, id))
      .run();
  },
};
