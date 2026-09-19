import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/common/Badge';
import {
  RefreshCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Cloud,
  Database,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { offlineSyncService } from '../services/offlineSyncService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { SyncQueueItem, SyncState } from '../types';

export const Sync: React.FC = () => {
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateState = () => {
      setSyncQueue(offlineSyncService.getQueue());
      setSyncState(offlineSyncService.getSyncState());
      setIsSyncing(offlineSyncService.getIsSyncing());
      setOfflineMode(offlineSyncService.isOfflineMode());
    };

    updateState();
    const unsubscribe = offlineSyncService.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  const handleSyncNow = async () => {
    setSyncSuccessMessage(null);
    const success = await offlineSyncService.syncNow();
    if (success) {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSyncSuccessMessage('All records synchronized successfully with Supabase backend.');
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }
  };

  const handleToggleOffline = () => {
    offlineSyncService.setOfflineMode(!offlineMode);
  };

  const handleRetryItem = (id: string) => {
    offlineSyncService.retryQueueItem(id);
  };

  const supabaseActive = isSupabaseConfigured();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Sync & Data Transmission</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Offline-first local delta queue and direct Supabase database replication
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={offlineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            onClick={handleToggleOffline}
          >
            {offlineMode ? 'Go Online' : 'Simulate Offline'}
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={isSyncing || offlineMode}
            icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            onClick={handleSyncNow}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* Sync Success Banner */}
      {syncSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* Connectivity & Node Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Network Status */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Network Channel
            </span>
            {offlineMode ? (
              <WifiOff className="w-5 h-5 text-danger" />
            ) : (
              <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${offlineMode ? 'bg-danger' : 'bg-emerald-500'}`} />
              <span className="text-lg font-semibold text-text">
                {offlineMode ? 'Offline Mode' : 'Online / Cellular'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {offlineMode
                ? 'Mutations are buffered locally in device storage'
                : 'Connected to regional network'}
            </p>
          </div>
        </Card>

        {/* Card 2: Sync State */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Sync Queue
            </span>
            <Database className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono-tabular text-text">
                {syncQueue.length}
              </span>
              <span className="text-xs text-text-muted uppercase tracking-wider">
                {syncQueue.length === 1 ? 'record pending' : 'records pending'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Last synced: {lastSyncedTime}
            </p>
          </div>
        </Card>

        {/* Card 3: Backend Integration */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Cloud Target
            </span>
            <Cloud className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={supabaseActive ? 'success' : 'neutral'} size="sm">
                {supabaseActive ? 'Supabase Connected' : 'Local Storage Engine'}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {supabaseActive
                ? 'Direct RPC transactions (pull_clinic_changes & push_clinic_changes)'
                : 'Local device cache active; Supabase credentials can be set in .env'}
            </p>
          </div>
        </Card>
      </div>

      {/* Pending Queue Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <h2 className="text-base font-semibold text-text">Pending Transmission Queue</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Mutations made while disconnected from the rural clinic server
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-text-muted">
            {syncQueue.length} {syncQueue.length === 1 ? 'item' : 'items'} queued
          </span>
        </div>

        {syncQueue.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-serif text-lg text-text mb-1">All records synchronized</p>
            <p className="text-xs text-text-muted">
              All clinical visits, patient enrollments, and prescriptions are synchronized with the central register.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {syncQueue.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        item.status === 'failed'
                          ? 'danger'
                          : item.status === 'syncing'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono-tabular text-text-muted">
                      {item.timestamp}
                    </span>
                    <span className="text-xs text-text-faint uppercase font-mono tracking-wider">
                      {item.entityType}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-text leading-snug">
                    {item.description}
                  </p>

                  {item.errorMessage && (
                    <div className="flex items-center gap-1.5 text-xs text-danger mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.errorMessage}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSyncing || offlineMode}
                    onClick={() => handleRetryItem(item.id)}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rural EMR Architecture Note */}
      <Card className="p-6 bg-surface-alt/50 border border-border">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div className="text-xs text-text-muted space-y-1">
            <p className="font-medium text-text">
              Direct Offline-First Protocol
            </p>
            <p>
              Kaya uses optimistic local persistence in the clinician&apos;s browser/device storage.
              All consultations, vitals, prescriptions, and patient registrations write immediately to the local store
              and enqueue an idempotent mutation record.
            </p>
            <p>
              When a cellular connection or Sub-Centre Wi-Fi link becomes available, the batch is pushed directly
              to PostgreSQL via the atomic <code className="font-mono text-primary">push_clinic_changes</code> RPC,
              and delta changes from other clinicians are pulled in a single transaction.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
