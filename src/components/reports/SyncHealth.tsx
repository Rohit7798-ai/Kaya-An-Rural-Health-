import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncPill } from '../ui/SyncPill';
import { SyncHealthStats } from '../../features/reports/reportsTypes';

export interface SyncHealthProps {
  stats: SyncHealthStats;
  periodLabel?: string;
  onViewSyncLog?: () => void;
}

export const SyncHealth: React.FC<SyncHealthProps> = ({
  stats,
  periodLabel = '30 days',
  onViewSyncLog,
}) => {
  const navigate = useNavigate();

  const handleViewLog = () => {
    if (onViewSyncLog) {
      onViewSyncLog();
    } else {
      navigate('/sync');
    }
  };

  const syncStatus = stats.pendingCount > 0 ? 'pending' : 'synced';

  return (
    <div className="bg-surface border border-border rounded-md p-6 sm:p-8 shadow-none text-left">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-border">
        <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
          Sync health
        </span>
        <SyncPill
          status={syncStatus}
          pendingCount={stats.pendingCount}
          lastSyncedText={stats.lastSuccessfulSyncText}
          onClick={handleViewLog}
        />
      </div>

      {/* Body: Three rows with 1px divider between each */}
      <div className="divide-y divide-border mb-6">
        <div className="py-3 flex items-center justify-between">
          <span className="text-sm font-sans text-text">Records synced</span>
          <span className="font-mono text-sm text-text tabular-nums">
            {stats.recordsSynced}
          </span>
        </div>

        <div className="py-3 flex items-center justify-between">
          <span className="text-sm font-sans text-text">Pending</span>
          <span
            className={`font-mono text-sm tabular-nums ${
              stats.pendingCount > 0 ? 'text-warning font-medium' : 'text-text'
            }`}
          >
            {stats.pendingCount}
          </span>
        </div>

        <div className="py-3 flex items-center justify-between">
          <span className="text-sm font-sans text-text">Last successful sync</span>
          <span className="font-mono text-sm text-text tabular-nums">
            {stats.lastSuccessfulSyncText}
          </span>
        </div>

        {/* Optional Error Row if there are any errors in the period */}
        {stats.errorsCount !== undefined && stats.errorsCount > 0 && (
          <div className="py-3 flex items-center justify-between">
            <span className="text-sm font-sans text-text">
              Errors (last {periodLabel})
            </span>
            <span className="font-mono text-sm text-danger font-medium tabular-nums">
              {stats.errorsCount}
            </span>
          </div>
        )}
      </div>

      {/* Success rate bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-sans text-text-muted">
          <span>Success rate</span>
          <span className="font-mono">{stats.successRatePercent}%</span>
        </div>

        <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
          <div
            style={{ width: `${stats.successRatePercent}%` }}
            className="h-full bg-accent rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* If errors > 0, show ghost text button below */}
      {stats.errorsCount !== undefined && stats.errorsCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={handleViewLog}
            className="text-xs font-sans text-text-muted hover:text-text cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            <span>View sync log →</span>
          </button>
        </div>
      )}
    </div>
  );
};
