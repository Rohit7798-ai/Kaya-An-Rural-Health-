import React, { useState, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SectionCard } from './SectionCard';
import { StaffMember } from '../../features/settings/useStaff';
import { UserRole } from '../../features/settings/useSettings';

export interface StaffSectionProps {
  staffList: StaffMember[];
  userRole: UserRole;
  isInviteOpen: boolean;
  onToggleInvite: (open: boolean) => void;
  onInvite: (email: string, role: UserRole) => void;
  onResendInvite: (id: string) => void;
  onChangeRole: (id: string, newRole: UserRole) => void;
  onToggleDisable: (id: string) => void;
  onRemoveStaff: (id: string) => void;
  isOffline?: boolean;
}

const ALL_ROLES: UserRole[] = ['Admin', 'Clinician', 'Health worker', 'Viewer'];

export const StaffSection: React.FC<StaffSectionProps> = ({
  staffList,
  userRole,
  isInviteOpen,
  onToggleInvite,
  onInvite,
  onResendInvite,
  onChangeRole,
  onToggleDisable,
  onRemoveStaff,
  isOffline,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Health worker');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Can the current user invite or manage staff?
  // Admins and Clinicians can manage staff. Viewers see read-only without Actions menu.
  const canManageStaff = userRole === 'Admin' || userRole === 'Clinician';

  // Esc key cancels inline invite form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInviteOpen) {
          onToggleInvite(false);
        }
        if (editingRoleId) {
          setEditingRoleId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInviteOpen, editingRoleId, onToggleInvite]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInvite(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteRole('Health worker');
  };

  const headerAction = canManageStaff ? (
    <button
      type="button"
      disabled={isOffline}
      onClick={() => onToggleInvite(!isInviteOpen)}
      title={isOffline ? 'Needs a connection.' : 'Invite a new team member'}
      className="h-8 px-3 text-xs font-sans font-medium text-surface bg-accent hover:bg-accent-hover rounded-sm cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Invite staff
    </button>
  ) : null;

  return (
    <SectionCard id="section-staff" title="Staff" headerAction={headerAction}>
      {/* Table: compact, no zebra striping */}
      <div className="overflow-x-auto -mx-8 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-xs font-sans text-text-muted">
              <th className="py-2.5 px-4 font-medium">Name</th>
              <th className="py-2.5 px-4 font-medium">Role</th>
              <th className="py-2.5 px-4 font-medium">Last active</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              {canManageStaff && <th className="py-2.5 px-4 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-sans text-xs">
            {staffList.map((member) => {
              const isEditingRole = editingRoleId === member.id;

              return (
                <tr key={member.id} className="hover:bg-surface-alt transition-colors">
                  {/* Name (Inter 500) */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-text text-sm">
                        {member.name}
                        {member.isCurrentUser && (
                          <span className="ml-2 font-normal text-xs text-text-muted font-mono">
                            (you)
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs text-text-muted">{member.email}</span>
                    </div>
                  </td>

                  {/* Role (Inter, with inline edit if active) */}
                  <td className="py-3 px-4">
                    {isEditingRole ? (
                      <select
                        autoFocus
                        value={member.role}
                        onChange={(e) => onChangeRole(member.id, e.target.value as UserRole)}
                        onBlur={() => setEditingRoleId(null)}
                        className="h-7 px-2 bg-surface-alt border border-accent text-text text-xs rounded-sm focus-visible:outline-none"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-text">{member.role}</span>
                    )}
                  </td>

                  {/* Last active (mono) */}
                  <td className="py-3 px-4 font-mono text-text-muted whitespace-nowrap">
                    {member.lastActive}
                  </td>

                  {/* Status (pill: Active: accent-soft/accent, Invited: warning-soft/warning, Disabled: surface-alt/text-muted) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {member.status === 'Active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-accent-soft text-accent">
                        Active
                      </span>
                    )}
                    {member.status === 'Invited' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-medium bg-warning-soft text-warning">
                        Invited
                      </span>
                    )}
                    {member.status === 'Disabled' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans text-text-muted bg-surface-alt border border-border">
                        Disabled
                      </span>
                    )}
                  </td>

                  {/* Actions menu (⋯) */}
                  {canManageStaff && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for ${member.name}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-alt border border-transparent hover:border-border transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            sideOffset={4}
                            className="min-w-[170px] bg-surface border border-border rounded-sm p-1 z-50 text-left font-sans text-xs shadow-none"
                          >
                            {member.status === 'Invited' && (
                              <DropdownMenu.Item
                                onClick={() => onResendInvite(member.id)}
                                className="px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                              >
                                Resend invite
                              </DropdownMenu.Item>
                            )}

                            <DropdownMenu.Item
                              onClick={() => setEditingRoleId(member.id)}
                              className="px-3 py-2 rounded-sm text-text hover:bg-surface-alt cursor-pointer outline-none focus:bg-surface-alt"
                            >
                              Change role
                            </DropdownMenu.Item>

                            {!member.isCurrentUser && (
                              <>
                                <DropdownMenu.Separator className="h-px bg-border my-1" />

                                <DropdownMenu.Item
                                  onClick={() => onToggleDisable(member.id)}
                                  className="px-3 py-2 rounded-sm text-danger hover:bg-danger-soft cursor-pointer outline-none focus:bg-danger-soft"
                                >
                                  {member.status === 'Disabled' ? 'Enable' : 'Disable'}
                                </DropdownMenu.Item>

                                <DropdownMenu.Item
                                  onClick={() => onRemoveStaff(member.id)}
                                  className="px-3 py-2 rounded-sm text-danger hover:bg-danger-soft cursor-pointer outline-none focus:bg-danger-soft"
                                >
                                  Remove from clinic
                                </DropdownMenu.Item>
                              </>
                            )}

                            {member.isCurrentUser && (
                              <>
                                <DropdownMenu.Separator className="h-px bg-border my-1" />
                                <div className="px-3 py-1.5 text-[11px] font-sans text-text-muted italic">
                                  You can't remove yourself.
                                </div>
                              </>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inline Invite Form (appears below the table when "Invite staff" clicked) */}
      {isInviteOpen && canManageStaff && (
        <form
          onSubmit={handleSendInvite}
          className="mt-6 p-4 bg-surface-alt/60 border border-border rounded-sm flex flex-col sm:flex-row sm:items-center gap-3 text-xs font-sans animate-in fade-in duration-150"
        >
          <div className="flex-1">
            <label htmlFor="invite-email-input" className="sr-only">
              Staff email address
            </label>
            <input
              id="invite-email-input"
              autoFocus
              type="email"
              required
              placeholder="name@clinic.org"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full h-8 px-2.5 bg-surface border border-border text-text font-sans text-xs rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent placeholder:text-text-muted"
            />
          </div>

          <div className="w-full sm:w-36">
            <label htmlFor="invite-role-select" className="sr-only">
              Staff role
            </label>
            <select
              id="invite-role-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full h-8 px-2 bg-surface border border-border text-text font-sans text-xs rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onToggleInvite(false)}
              className="h-8 px-3 text-xs font-sans text-text-muted hover:text-text bg-surface hover:bg-border/60 border border-border rounded-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inviteEmail.trim()}
              className="h-8 px-3 text-xs font-sans font-medium text-surface bg-accent hover:bg-accent-hover rounded-sm cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send invite
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
};
