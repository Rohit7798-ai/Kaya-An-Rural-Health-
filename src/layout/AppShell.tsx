import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  MoreHorizontal,
  Calendar,
  Users,
  FileText,
  BarChart2,
  RefreshCw,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { SyncPill } from '../components/ui/SyncPill';
import { SyncDrawer } from '../components/sync/SyncDrawer';
import { offlineSyncService } from '../services/offlineSyncService';
import { SyncQueueItem, SyncState } from '../types';
import { pullAll } from '../lib/pull';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState('2m ago');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  React.useEffect(() => {
    const updateSyncInfo = () => {
      setSyncQueue(offlineSyncService.getQueue());
      setSyncState(offlineSyncService.getSyncState());
      setIsSyncing(offlineSyncService.getIsSyncing());
      setOfflineMode(offlineSyncService.isOfflineMode());
    };

    updateSyncInfo();
    const unsub = offlineSyncService.subscribe(updateSyncInfo);
    return () => unsub();
  }, []);

  // One-time non-blocking hydration step from Supabase to Dexie
  React.useEffect(() => {
    pullAll();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('kaya_dark_mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('kaya_dark_mode', 'false');
    }
  };

  const navItems = [
    { label: 'Today', path: '/today', icon: Calendar },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Visits', path: '/visits', icon: FileText },
    { label: 'Reports', path: '/reports', icon: BarChart2 },
    { label: 'Sync', path: '/sync', icon: RefreshCw },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans antialiased">
      {/* 64px Top Bar */}
      <header className="h-16 px-6 bg-surface border-b border-border flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Left: Brand Dot + Kaya */}
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full bg-accent shrink-0"
            aria-hidden="true"
          />
          <span className="font-sans font-medium text-lg text-text tracking-tight">
            Kaya
          </span>
        </div>

        {/* Center: Global Search Input with ⌘K Hint */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative flex items-center w-full">
            <Search
              className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search patients, register numbers…"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  searchInputRef.current?.blur();
                } else if (e.key === 'Enter') {
                  const val = searchInputRef.current?.value.trim();
                  if (val) {
                    navigate(`/patients?search=${encodeURIComponent(val)}`);
                  }
                }
              }}
              className="w-full h-9 pl-9 pr-12 bg-surface-alt text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 transition-colors placeholder:text-text-faint"
            />
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="absolute right-2 flex items-center cursor-pointer text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
              aria-label="Focus search (⌘K)"
            >
              <kbd className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface text-text-muted border border-border pointer-events-none select-none">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Right: SyncPill + Overflow Menu */}
        <div className="flex items-center gap-3">
          <SyncPill
            status={syncState === 'offline' ? 'error' : syncState === 'pending' ? 'pending' : 'synced'}
            label={offlineMode ? 'Offline' : undefined}
            pendingCount={syncQueue.length}
            lastSyncedText={lastSyncedText}
            onClick={() => setIsSyncDrawerOpen(true)}
          />

          {/* Radix Dropdown Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Application menu"
                className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="min-w-[180px] bg-surface border border-border rounded-md shadow-none p-1 z-50 text-left font-sans text-sm"
              >
                <DropdownMenu.Item
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  ) : (
                    <Moon className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  )}
                  <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                >
                  <Settings className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                  <span>Clinic settings</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-border my-1" />

                <DropdownMenu.Item
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-danger hover:bg-danger-soft cursor-pointer outline-none focus:bg-danger-soft"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span>Sign out</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Main Body: 240px Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 240px Sidebar */}
        <aside
          aria-label="Main Navigation"
          className="w-[240px] bg-surface border-r border-border shrink-0 flex flex-col py-4"
        >
          <nav className="flex-1 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 h-10 px-4 text-sm font-sans transition-colors select-none ${
                    isActive
                      ? 'bg-accent-soft text-text border-l-[3px] border-l-accent font-medium'
                      : 'text-text-muted hover:text-text hover:bg-surface-alt border-l-[3px] border-l-transparent'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Sidebar Note */}
          <div className="px-4 pt-4 border-t border-border">
            <div className="text-xs text-text-muted font-mono leading-relaxed">
              Kaya EMR v0.1
              <div className="text-text-faint text-[11px]">Sub-centre offline node</div>
            </div>
          </div>
        </aside>

        {/* Content Area: bg color, 24px padding (p-6), max-width 1280px centered */}
        <main className="flex-1 bg-bg overflow-y-auto p-6">
          <div className="max-w-[1280px] mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Offline Sync Drawer */}
      <SyncDrawer
        isOpen={isSyncDrawerOpen}
        onClose={() => setIsSyncDrawerOpen(false)}
        syncQueue={syncQueue}
        syncState={syncState}
        onRetryItem={(id) => offlineSyncService.retryQueueItem(id)}
        onSyncAll={async () => {
          const success = await offlineSyncService.syncNow();
          if (success) {
            setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }}
        isSyncing={isSyncing}
        offlineMode={offlineMode}
        onToggleOfflineMode={() => offlineSyncService.setOfflineMode(!offlineMode)}
        lastSyncedTimestamp={lastSyncedText}
      />
    </div>
  );
};
