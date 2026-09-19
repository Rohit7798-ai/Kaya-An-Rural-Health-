import React from 'react';
import { HeadlineStats } from '../../features/reports/reportsTypes';

export interface HeadlineNumbersProps {
  stats: HeadlineStats;
  hasData: boolean;
  onShowLast30Days?: () => void;
}

export const HeadlineNumbers: React.FC<HeadlineNumbersProps> = ({
  stats,
  hasData,
  onShowLast30Days,
}) => {
  if (!hasData) {
    return (
      <div className="bg-surface border border-border rounded-md p-8 shadow-none text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-serif text-base text-text">
            No visits in this period.
          </p>
          {onShowLast30Days && (
            <button
              type="button"
              onClick={onShowLast30Days}
              className="h-8 px-3 inline-flex items-center text-xs font-sans text-text-muted hover:text-text bg-surface-alt hover:bg-border/60 border border-border rounded-sm cursor-pointer transition-colors w-fit"
            >
              Show last 30 days
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPendingWarning = stats.pendingSync > 0;

  return (
    <div className="bg-surface border border-border rounded-md p-8 shadow-none text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Patients seen */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
            Patients seen
          </span>
          <span className="text-3xl font-normal font-mono text-text leading-tight mt-1">
            {stats.patientsSeen}
          </span>
          <span className="text-xs text-text-muted font-mono mt-1">
            {stats.patientsSeenDelta}
          </span>
        </div>

        {/* Column 2: New registrations */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
            New registrations
          </span>
          <span className="text-3xl font-normal font-mono text-text leading-tight mt-1">
            {stats.newRegistrations}
          </span>
          <span className="text-xs text-text-muted font-mono mt-1">
            {stats.newRegistrationsDelta}
          </span>
        </div>

        {/* Column 3: Follow-ups */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
            Follow-ups
          </span>
          <span className="text-3xl font-normal font-mono text-text leading-tight mt-1">
            {stats.followUps}
          </span>
          <span className="text-xs text-text-muted font-mono mt-1">
            {stats.followUpsDelta}
          </span>
        </div>

        {/* Column 4: Pending sync */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
            Pending sync
          </span>
          <span
            className={`text-3xl font-normal font-mono leading-tight mt-1 ${
              isPendingWarning ? 'text-warning' : 'text-text'
            }`}
          >
            {stats.pendingSync}
          </span>
          <span className="text-xs text-text-muted font-mono mt-1">
            {stats.pendingSyncDelta}
          </span>
        </div>
      </div>
    </div>
  );
};
