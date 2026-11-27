import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { taskFolders, tasks } from '../db/schema';
import type { TaskFolder } from '../types/models';
import { generateId, nowIsoUtc } from '../utils/id';

function mapFolderRow(row: typeof taskFolders.$inferSelect): TaskFolder {
  return {
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    name: row.name,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isSynced: row.is_synced === 1,
  };
}

export interface CreateTaskFolderInput {
  userId: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateTaskFolderInput {
  name: string;
}

export const taskFolderRepository = {
  getAll(userId: string): TaskFolder[] {
    const rows = db
      .select()
      .from(taskFolders)
      .where(
        and(eq(taskFolders.user_id, userId), isNull(taskFolders.deleted_at))
      )
      .orderBy(
        asc(taskFolders.sort_order),
        asc(taskFolders.created_at),
        asc(taskFolders.name)
      )
      .all();

    return rows.map(mapFolderRow);
  },

  create(input: CreateTaskFolderInput): TaskFolder {
    const now = nowIsoUtc();
    const id = generateId();
    const parentId = input.parentId ?? null;

    const siblings = this.getAll(input.userId).filter(
      (f) => (f.parentId ?? null) === parentId
    );
    const nextSortOrder =
      siblings.length > 0
        ? Math.max(...siblings.map((s, idx) => s.sortOrder ?? idx)) + 1
        : 0;

    db.insert(taskFolders)
      .values({
        id,
        user_id: input.userId,
        parent_id: parentId,
        name: input.name.trim(),
        sort_order: nextSortOrder,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_synced: 0,
      })
      .run();

    return {
      id,
      userId: input.userId,
      parentId,
      name: input.name.trim(),
      sortOrder: nextSortOrder,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isSynced: false,
    };
  },

  update(id: string, input: UpdateTaskFolderInput): void {
    const now = nowIsoUtc();
    db.update(taskFolders)
      .set({
        name: input.name.trim(),
        updated_at: now,
        is_synced: 0,
      })
      .where(eq(taskFolders.id, id))
      .run();
  },

  reorder(orderedIds: string[]): void {
    const now = nowIsoUtc();
    orderedIds.forEach((id, index) => {
      db.update(taskFolders)
        .set({
          sort_order: index,
          updated_at: now,
          is_synced: 0,
        })
        .where(eq(taskFolders.id, id))
        .run();
    });
  },

  /**
   * Soft-deletes the folder, all nested subfolders, and all tasks inside them.
   */
  softDeleteCascade(userId: string, folderId: string): void {
    const now = nowIsoUtc();
    const allFolders = this.getAll(userId);

    const idsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of allFolders) {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          added = true;
        }
      }
    }

    const folderIds = Array.from(idsToDelete);

    db.update(taskFolders)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(inArray(taskFolders.id, folderIds))
      .run();

    db.update(tasks)
      .set({
        deleted_at: now,
        updated_at: now,
        is_synced: 0,
      })
      .where(inArray(tasks.folder_id, folderIds))
      .run();
  },
};
