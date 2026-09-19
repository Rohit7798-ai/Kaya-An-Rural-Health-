// Sync Queue Drainer
// Pushes client-queued mutations from Dexie to Supabase.

import { db, SyncQueueRow } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

export async function drainSyncQueue(): Promise<{ processed: number; errors: number }> {
  const pendingItems = await db.sync_queue
    .where('status')
    .equals('pending')
    .toArray();

  if (pendingItems.length === 0) {
    return { processed: 0, errors: 0 };
  }

  if (!isSupabaseConfigured() || !navigator.onLine) {
    return { processed: 0, errors: 0 };
  }

  // Format mutations for push_clinic_changes RPC
  const mutations = pendingItems.map((item) => ({
    table: item.table,
    operation: item.operation,
    record_id: item.record_id,
    data: item.payload || item.data,
  }));

  try {
    const { error } = await supabase.rpc('push_clinic_changes', { mutations });
    if (error) throw error;

    // Mark as synced
    await db.transaction('rw', db.sync_queue, async () => {
      for (const item of pendingItems) {
        await db.sync_queue.update(item.id, {
          status: 'synced',
          attempts: (item.attempts || 0) + 1,
        });
      }
    });

    try {
      localStorage.setItem('kaya:last_sync', new Date().toISOString());
    } catch {
      // Ignore localStorage errors
    }

    return { processed: pendingItems.length, errors: 0 };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Push failed';
    await db.transaction('rw', db.sync_queue, async () => {
      for (const item of pendingItems) {
        const nextAttempts = (item.attempts || 0) + 1;
        await db.sync_queue.update(item.id, {
          status: 'failed',
          attempts: nextAttempts,
          retry_count: nextAttempts,
          error_message: errMsg,
        });
      }
    });

    return { processed: 0, errors: pendingItems.length };
  }
}

// Alias requested in spec
export const drainQueue = drainSyncQueue;
