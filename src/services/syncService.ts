import { syncMetadataRepository } from '../repositories/syncMetadataRepository';
import { nowIsoUtc } from '../utils/id';

export interface SyncResult {
  pushedCount: number;
  pulledCount: number;
  syncedAt: string;
}

/**
 * Abstraction layer for Phase 1 (Supabase PostgreSQL) -> Phase 2 (Self-hosted VPS / Laravel API).
 * UI components never call remote APIs directly; they only read/write local SQLite repositories
 * and trigger SyncService when online.
 */
export const syncService = {
  async runDeltaSync(): Promise<SyncResult> {
    // Week 4 will connect this to Supabase / VPS REST endpoints:
    // Step 1 (PUSH): Batch upsert all local rows where is_synced = 0
    //                in order: tasks -> task_completions -> subscriptions -> diary_entries
    // Step 2 (PULL): Fetch server rows where updated_at > last_synced_at and upsert locally
    const syncedAt = nowIsoUtc();
    syncMetadataRepository.set('last_synced_at', syncedAt);

    return {
      pushedCount: 0,
      pulledCount: 0,
      syncedAt,
    };
  },
};
