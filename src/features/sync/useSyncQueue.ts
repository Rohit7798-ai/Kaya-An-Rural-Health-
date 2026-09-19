// Sync Queue hook reading live status from Dexie db.sync_queue
import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SyncQueueRow } from '../../lib/db';
import { drainQueue } from '../../lib/sync';
import { SyncQueueItem, SyncState } from '../../types';

export function useSyncQueue() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Live query of queue items
  const queueRows = useLiveQuery(async () => {
    return db.sync_queue.orderBy('created_at').reverse().toArray();
  }, []);

  // Total count of local records across patients, visits, prescriptions, attachments
  const totalRecords = useLiveQuery(async () => {
    const counts = await Promise.all([
      db.patients.count(),
      db.visits.count(),
      db.prescriptions.count(),
      db.attachments.count(),
    ]);
    return counts.reduce((acc, c) => acc + c, 0);
  }, []);

  const waiting = (queueRows || []).filter((r) => r.status === 'pending' || r.status === 'syncing');
  const failed = (queueRows || []).filter((r) => (r.attempts || 0) > 0 || r.status === 'failed');

  const lastSync = localStorage.getItem('kaya:last_sync') || 'Just now';

  // Compute sync state
  let syncState: SyncState = 'synced';
  if (!navigator.onLine) {
    syncState = 'offline';
  } else if (waiting.length > 0 || isSyncing || failed.length > 0) {
    syncState = 'pending';
  }

  // Retry now
  const retryNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await drainQueue();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Retry single op
  const retrySingle = useCallback(
    async (id: string) => {
      await db.sync_queue.update(id, {
        attempts: 0,
        status: 'pending',
      });
      await retryNow();
    },
    [retryNow]
  );

  // Retry all failed ops
  const retryAllFailed = useCallback(async () => {
    const failedRows = await db.sync_queue
      .filter((r) => (r.attempts || 0) > 0 || r.status === 'failed')
      .toArray();

    await db.transaction('rw', db.sync_queue, async () => {
      for (const row of failedRows) {
        await db.sync_queue.update(row.id, {
          attempts: 0,
          status: 'pending',
        });
      }
    });

    await retryNow();
  }, [retryNow]);

  // Format queue items into SyncQueueItem for existing UI components
  const items: SyncQueueItem[] = (queueRows || []).map((row) => ({
    id: row.id,
    entityType: row.table === 'patients' ? 'patient' : 'visit',
    entityId: row.record_id,
    description: `${row.operation.toUpperCase()} ${row.table} (${row.record_id.slice(0, 8)})`,
    timestamp: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    status: row.status,
    retryCount: row.attempts || 0,
    errorMessage: row.error_message,
  }));

  return {
    waiting,
    failed,
    total: totalRecords ?? 0,
    lastSync,
    isSyncing,
    syncState,
    items,
    retryNow,
    retrySingle,
    retryAllFailed,
  };
}
