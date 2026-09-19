import React from 'react';
import { SyncQueueItem, SyncState } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, RefreshCw, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

interface SyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncQueue: SyncQueueItem[];
  syncState: SyncState;
  onRetryItem: (id: string) => void;
  onSyncAll: () => void;
  isSyncing: boolean;
  offlineMode: boolean;
  onToggleOfflineMode: () => void;
  lastSyncedTimestamp: string;
}

export const SyncDrawer: React.FC<SyncDrawerProps> = ({
  isOpen,
  onClose,
  syncQueue,
  syncState,
  onRetryItem,
  onSyncAll,
  isSyncing,
  offlineMode,
  onToggleOfflineMode,
  lastSyncedTimestamp,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offline Sync Queue"
      className="fixed inset-0 z-50 flex justify-end bg-black/25 transition-opacity duration-200"
    >
      <div className="w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col justify-between modal-hairline-shadow text-left">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--text)]">Offline Sync Queue</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              Local patient and visit records pending sync
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] cursor-pointer"
            title="Close drawer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status banner & Offline toggle */}
        <div className="p-4 bg-[var(--surface-alt)] border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px]">
            {offlineMode ? (
              <>
                <WifiOff className="w-4 h-4 text-[var(--danger)]" />
                <span className="text-[var(--danger)] font-medium">Working Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[var(--text)]">
                  Network Online <span className="text-[var(--text-muted)]">· {lastSyncedTimestamp}</span>
                </span>
              </>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleOfflineMode}
            title="Toggle simulated connection state"
          >
            {offlineMode ? 'Go online' : 'Simulate offline'}
          </Button>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-[var(--border)]">
          {syncQueue.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-clinical-notes text-[17px] text-[var(--text-muted)] mb-3">
                All records are synchronized with central register.
              </p>
              <p className="text-[13px] text-[var(--text-faint)]">
                Any changes made offline will appear here automatically.
              </p>
            </div>
          ) : (
            syncQueue.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
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
                      <span className="text-[12px] font-mono-tabular text-[var(--text-muted)]">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-[var(--text)] leading-snug">
                      {item.description}
                    </p>
                    {item.errorMessage && (
                      <p className="text-[12px] text-[var(--danger)] mt-1">{item.errorMessage}</p>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSyncing || offlineMode}
                    onClick={() => onRetryItem(item.id)}
                    title="Retry sync for this item"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between gap-3">
          <span className="text-[12px] font-mono-tabular text-[var(--text-muted)]">
            {syncQueue.length} {syncQueue.length === 1 ? 'item' : 'items'} in queue
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={syncQueue.length === 0 || isSyncing || offlineMode}
              onClick={onSyncAll}
              icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? 'Syncing…' : 'Sync all now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
