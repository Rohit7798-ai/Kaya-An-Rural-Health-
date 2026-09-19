import React from 'react';
import { ScreenType, StaffUser } from '../../types';
import {
  CalendarDays,
  Users,
  FileText,
  BarChart3,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: StaffUser;
  clinicName: string;
  onLogout: () => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  collapsed,
  onToggleCollapse,
  currentUser,
  clinicName,
  onLogout,
  pendingCount,
}) => {
  const navItems = [
    {
      id: 'today' as ScreenType,
      label: 'Today',
      icon: CalendarDays,
      shortcut: 'T',
    },
    {
      id: 'patients' as ScreenType,
      label: 'Patients',
      icon: Users,
      shortcut: 'P',
    },
    {
      id: 'visits' as ScreenType,
      label: 'Visits',
      icon: FileText,
      shortcut: 'V',
    },
    {
      id: 'reports' as ScreenType,
      label: 'Reports',
      icon: BarChart3,
      shortcut: 'R',
    },
    {
      id: 'settings' as ScreenType,
      label: 'Settings',
      icon: Settings,
      shortcut: 'S',
    },
  ];

  return (
    <aside
      className={`h-[calc(100vh-64px)] shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between transition-all duration-120 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Nav Items */}
      <div className="flex flex-col py-3">
        <div className="px-3 mb-2 flex items-center justify-between">
          {!collapsed && (
            <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)] px-3">
              Navigation
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] cursor-pointer ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentScreen === item.id ||
              (item.id === 'patients' &&
                (currentScreen === 'new-patient' || currentScreen === 'patient-profile')) ||
              (item.id === 'visits' && currentScreen === 'visit-notes');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative flex items-center gap-3 h-11 px-3 rounded-[6px] text-[14px] font-medium transition-colors select-none cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border-l-[3px] border-l-[var(--accent)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-alt)] border-l-[3px] border-l-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={`${item.label} (${item.shortcut})`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && (
                  <span className="text-[11px] font-mono-tabular text-[var(--text-faint)]">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Clinician & Clinic Card */}
      <div className="p-3 border-t border-[var(--border)]">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--surface-alt)] rounded-[6px]">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[var(--text)] truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {currentUser.role}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              title="Sign out / Switch user"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-alt)] cursor-pointer"
              title={`Signed in as ${currentUser.name}. Click to switch user.`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
