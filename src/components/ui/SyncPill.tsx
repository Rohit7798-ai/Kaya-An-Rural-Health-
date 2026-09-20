import React from 'react';

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface SyncPillProps {
  status: SyncStatus;
  label?: string;
  pendingCount?: number;
  lastSyncedText?: string;
  onClick?: () => void;
  className?: string;
}

export const SyncPill: React.FC<SyncPillProps> = ({
  status,
  label,
  pendingCount = 0,
  lastSyncedText,
  onClick,
  className = '',
}) => {
  const configs = {
    synced: {
      dotColor: 'bg-sync-ok',
      defaultLabel: lastSyncedText ? `Synced · ${lastSyncedText}` : 'Synced',
      textColor: 'text-text-muted',
    },
    pending: {
      dotColor: 'bg-sync-pending animate-pulse',
      defaultLabel: pendingCount > 0 ? `${pendingCount} pending` : 'Sync pending',
      textColor: 'text-warning',
    },
    error: {
      dotColor: 'bg-sync-error',
      defaultLabel: 'Sync error',
      textColor: 'text-danger',
    },
  }[status];

  const displayLabel = label || configs.defaultLabel;

  const content = (
    <div
      className={`inline-flex items-center gap-2 h-8 px-2.5 bg-surface-alt/60 hover:bg-surface-alt text-xs font-mono rounded-md border border-border transition-colors ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${configs.dotColor}`} />
      <span className={`leading-none ${configs.textColor}`}>{displayLabel}</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Sync status: ${displayLabel}. Click to open sync queue.`}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-md cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return content;
};
