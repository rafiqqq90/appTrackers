import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { syncMetadata } from '../db/schema';

export const syncMetadataRepository = {
  get(key: string): string | null {
    const row = db
      .select()
      .from(syncMetadata)
      .where(eq(syncMetadata.key, key))
      .get();
    return row?.value ?? null;
  },

  set(key: string, value: string): void {
    db.insert(syncMetadata)
      .values({ key, value })
      .onConflictDoUpdate({
        target: syncMetadata.key,
        set: { value },
      })
      .run();
  },
};
