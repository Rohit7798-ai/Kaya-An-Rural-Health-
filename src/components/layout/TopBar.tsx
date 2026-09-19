import React from 'react';
import { SyncState } from '../../types';
import { Search, Moon, Sun, Keyboard, SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  syncState: SyncState;
  pendingCount: number;
  lastSyncedText: string;
  onOpenSyncDrawer: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  clinicName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  syncState,
  pendingCount,
  lastSyncedText,
  onOpenSyncDrawer,
  onOpenSearch,
  onOpenShortcuts,
  darkMode,
  onToggleDarkMode,
  clinicName,
}) => {
  return (
    <header className="h-16 shrink-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 flex items-center justify-between z-20">
      {/* Brand logo & mark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 select-none">
          <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[18px] tracking-tight text-[var(--text)]">Kaya</span>
        </div>
        <span className="text-[var(--border-strong)] hidden md:inline">|</span>
        <span className="text-[13px] text-[var(--text-muted)] truncate max-w-[260px] hidden md:inline">
          {clinicName}
        </span>
      </div>

      {/* Global Search trigger [ Search patients…  ⌘K ] */}
      <div className="flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full h-10 px-3.5 bg-[var(--surface-alt)] hover:bg-[var(--border)]/40 border border-[var(--border)] rounded-[6px] flex items-center justify-between text-[14px] text-[var(--text-muted)] transition-colors cursor-pointer group"
          title="Search patients (⌘K or /)"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)]" />
            <span className="text-[13px]">Search patients by name, ID, or village…</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono-tabular bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] rounded-[4px]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right ambient controls: Sync pill & utility buttons */}
      <div className="flex items-center gap-2">
        {/* Sync Pill (top-right, always visible) */}
        <button
          type="button"
          onClick={onOpenSyncDrawer}
          className="h-9 px-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] flex items-center gap-2 text-[12px] font-medium transition-colors cursor-pointer"
          title="Click to view sync queue"
          aria-live="polite"
        >
          {syncState === 'synced' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--sync-ok)] shrink-0" />
              <span className="text-[var(--text)]">Synced · {lastSyncedText}</span>
            </>
          )}

          {syncState === 'pending' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--sync-pending)] shrink-0 animate-pulse" />
              <span className="text-[var(--warning)] font-mono-tabular">
                {pendingCount} pending
              </span>
            </>
          )}

          {syncState === 'offline' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--sync-error)] shrink-0" />
              <span className="text-[var(--danger)]">Offline — will sync later</span>
            </>
          )}
        </button>

        {/* Keyboard shortcut help */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Theme toggle (Dark mode optional, off by default) */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
