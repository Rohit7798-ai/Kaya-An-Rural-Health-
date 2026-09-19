import React, { useState } from 'react';
import { BarListItem } from '../../features/reports/reportsTypes';

export interface BarListProps {
  title: string;
  subtitle: string;
  items: BarListItem[];
  minRowsForData?: number;
  emptyMessage?: string;
  onShowLast30Days?: () => void;
}

export const BarList: React.FC<BarListProps> = ({
  title,
  subtitle,
  items,
  minRowsForData = 3,
  emptyMessage = 'Not enough data for this period.',
  onShowLast30Days,
}) => {
  const [isOthersExpanded, setIsOthersExpanded] = useState<boolean>(false);

  // Determine maximum count for scaling
  const maxCount = items.length > 0 ? Math.max(...items.map((it) => it.count), 1) : 1;

  // If fewer than minRowsForData have data, show empty-state line
  const hasEnoughData = items.length >= minRowsForData;

  return (
    <div className="bg-surface border border-border rounded-md p-6 sm:p-8 shadow-none text-left">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-border">
        <span className="text-xs uppercase tracking-[0.04em] text-text-muted font-sans font-medium">
          {title}
        </span>
        <span className="text-xs text-text-muted font-sans">
          {subtitle}
        </span>
      </div>

      {/* Body: Horizontal Bar List or Empty State */}
      {!hasEnoughData ? (
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-serif text-sm text-text">
            {emptyMessage}
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
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isOthers = !!item.isOthers;
            const percentage = Math.max(Math.round((item.count / maxCount) * 100), 2);

            return (
              <React.Fragment key={item.id}>
                <div
                  className={`h-10 flex items-center gap-4 ${
                    isOthers ? 'cursor-pointer select-none group' : ''
                  }`}
                  onClick={isOthers ? () => setIsOthersExpanded(!isOthersExpanded) : undefined}
                >
                  {/* Left Column: Fixed 220px label */}
                  <div className="w-[220px] shrink-0 truncate">
                    <span
                      className={`text-sm truncate block font-sans ${
                        isOthers
                          ? 'text-text-muted group-hover:text-text font-normal'
                          : 'text-text font-medium'
                      }`}
                      title={item.label}
                    >
                      {item.label}
                      {isOthers && (
                        <span className="text-xs font-mono text-text-faint ml-1.5">
                          {isOthersExpanded ? '(collapse)' : '(click to expand)'}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Right Column: Bar + Mono Count */}
                  <div className="flex-1 flex items-center gap-3">
                    {/* Bar track and fill */}
                    <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOthers ? 'bg-border-strong' : 'bg-accent'
                        }`}
                      />
                    </div>

                    {/* Mono count aligned right */}
                    <span
                      className={`min-w-[40px] text-right font-mono text-sm tabular-nums shrink-0 ${
                        isOthers ? 'text-text-muted' : 'text-text'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                </div>

                {/* If this is the Others row and it is expanded, show sub-items */}
                {isOthers && isOthersExpanded && item.subItems && (
                  <div className="pl-6 py-1 flex flex-col gap-2 border-l-2 border-border ml-2 my-1">
                    {item.subItems.map((sub) => {
                      const subPct = Math.max(Math.round((sub.count / maxCount) * 100), 2);
                      return (
                        <div key={sub.id} className="h-8 flex items-center gap-4">
                          <div className="w-[196px] shrink-0 truncate">
                            <span className="text-xs font-sans text-text-muted truncate block">
                              {sub.label}
                            </span>
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 h-1 bg-surface-alt rounded-full overflow-hidden">
                              <div
                                style={{ width: `${subPct}%` }}
                                className="h-full rounded-full bg-border-strong transition-all duration-300"
                              />
                            </div>
                            <span className="min-w-[40px] text-right font-mono text-xs text-text-muted tabular-nums shrink-0">
                              {sub.count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
