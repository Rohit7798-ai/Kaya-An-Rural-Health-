import React from 'react';
import { Download, Calendar, ArrowRight } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DateRangePreset } from '../../features/reports/reportsTypes';

export interface DateRangeControlProps {
  preset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  resolvedRange: string;
  isCustomOpen: boolean;
  onToggleCustom: () => void;
  customStartDate: string;
  onChangeStartDate: (val: string) => void;
  customEndDate: string;
  onChangeEndDate: (val: string) => void;
  isOffline: boolean;
  exportMenuOpen: boolean;
  onExportMenuOpenChange: (open: boolean) => void;
  onExport: (type: 'csv-patients' | 'csv-visits' | 'pdf') => void;
}

export const DateRangeControl: React.FC<DateRangeControlProps> = ({
  preset,
  onSelectPreset,
  resolvedRange,
  isCustomOpen,
  onToggleCustom,
  customStartDate,
  onChangeStartDate,
  customEndDate,
  onChangeEndDate,
  isOffline,
  exportMenuOpen,
  onExportMenuOpenChange,
  onExport,
}) => {
  const segments: { key: DateRangePreset; label: string; shortcut?: string }[] = [
    { key: 'today', label: 'Today', shortcut: '⌘1' },
    { key: '7days', label: '7 days', shortcut: '⌘2' },
    { key: '30days', label: '30 days', shortcut: '⌘3' },
    { key: 'custom', label: 'Custom…' },
  ];

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Top row: segmented control + ghost download button */}
      <div className="flex items-center gap-2">
        {/* Segmented Control */}
        <div
          role="radiogroup"
          aria-label="Date range selector"
          className="inline-flex items-center p-0.5 bg-surface border border-border rounded-sm gap-1"
        >
          {segments.map((seg) => {
            const isActive = preset === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  if (seg.key === 'custom') {
                    onToggleCustom();
                  } else {
                    onSelectPreset(seg.key);
                  }
                }}
                className={`h-8 px-3 inline-flex items-center gap-1.5 text-xs font-sans rounded-sm transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-accent-soft text-accent border border-accent font-medium'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt border border-transparent'
                }`}
                title={seg.shortcut ? `${seg.label} (${seg.shortcut})` : seg.label}
              >
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ghost Download Icon Button with Dropdown */}
        <DropdownMenu.Root open={exportMenuOpen} onOpenChange={onExportMenuOpenChange}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Export reports (⌘E)"
              className="w-9 h-9 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt border border-border bg-surface transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              title="Export report data (⌘E)"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="min-w-[190px] bg-surface border border-border rounded-sm p-1 z-50 text-left font-sans text-xs shadow-none"
            >
              {isOffline && (
                <div className="px-3 py-1.5 text-[11px] font-mono text-warning bg-warning-soft/50 border-b border-border mb-1 rounded-sm">
                  Needs a connection to export
                </div>
              )}

              <DropdownMenu.Item
                disabled={isOffline}
                onClick={() => onExport('csv-patients')}
                title={isOffline ? 'Needs a connection.' : 'Export CSV of patient registry'}
                className="flex items-center justify-between px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Export CSV (patients)</span>
                <span className="font-mono text-[10px] text-text-faint">.csv</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                disabled={isOffline}
                onClick={() => onExport('csv-visits')}
                title={isOffline ? 'Needs a connection.' : 'Export CSV of visit records'}
                className="flex items-center justify-between px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Export CSV (visits)</span>
                <span className="font-mono text-[10px] text-text-faint">.csv</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-border my-1" />

              <DropdownMenu.Item
                disabled={isOffline}
                onClick={() => onExport('pdf')}
                title={isOffline ? 'Needs a connection.' : 'Export PDF clinical report summary'}
                className="flex items-center justify-between px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Export PDF summary</span>
                <span className="font-mono text-[10px] text-text-faint">.pdf</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Resolved Range below the control */}
      <div className="font-mono text-xs text-text-muted">
        {resolvedRange}
      </div>

      {/* Compact inline custom date picker below the row if open */}
      {isCustomOpen && (
        <div className="mt-2 p-3 bg-surface border border-border rounded-sm flex items-center gap-3 text-xs font-sans">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-text-muted">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="h-8 px-2 bg-surface-alt border border-border text-text font-mono text-xs rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <span className="text-text-faint font-mono">→</span>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-text-muted">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onChangeEndDate(e.target.value)}
              className="h-8 px-2 bg-surface-alt border border-border text-text font-mono text-xs rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <button
            type="button"
            onClick={() => onSelectPreset('custom')}
            className="h-8 px-3 bg-accent text-surface hover:bg-accent-hover font-sans text-xs font-medium rounded-sm cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
