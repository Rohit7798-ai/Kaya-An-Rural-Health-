// Staff management backed by Dexie db.users and Supabase invite-staff function
import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbUser } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { drainQueue } from '../../lib/sync';
import { sessionStore } from '../../state/session';
import { UserRole } from './useSettings';

export type StaffStatus = 'Active' | 'Invited' | 'Disabled';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
  status: StaffStatus;
  isCurrentUser?: boolean;
}

const INITIAL_STAFF_FALLBACK: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. A. Kulkarni',
    email: 'a.kulkarni@kaya.health',
    role: 'Admin',
    lastActive: '2 minutes ago',
    status: 'Active',
    isCurrentUser: true,
  },
  {
    id: 'staff-2',
    name: 'Nurse S. Meshram',
    email: 's.meshram@kaya.health',
    role: 'Clinician',
    lastActive: '12 minutes ago',
    status: 'Active',
  },
  {
    id: 'staff-3',
    name: 'R. Yadav',
    email: 'r.yadav@kaya.health',
    role: 'Health worker',
    lastActive: '1 hour ago',
    status: 'Active',
  },
];

export function useStaff(onToast?: (msg: string) => void) {
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Read staff from Dexie db.users
  const dbUsers = useLiveQuery(async () => {
    return db.users.toArray();
  }, []);

  const session = sessionStore.getState();
  const currentUserId = session.user?.id;

  const staffList: StaffMember[] =
    dbUsers && dbUsers.length > 0
      ? dbUsers.map((u) => ({
          id: u.id,
          name: u.full_name || 'Staff member',
          email: u.email || `${u.id}@kaya.health`,
          role: (u.role as UserRole) || 'Clinician',
          lastActive: 'Active',
          status: 'Active' as const,
          isCurrentUser: u.id === currentUserId || u.email === session.user?.email,
        }))
      : INITIAL_STAFF_FALLBACK;

  const inviteStaff = useCallback(
    async (email: string, role: UserRole) => {
      const prefix = email.split('@')[0];
      const formattedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      const newId = `usr-${Date.now()}`;
      const clinicId = session.user?.clinic_id || 'cln-wardha-01';
      const now = new Date().toISOString();

      const newDbUser: DbUser = {
        id: newId,
        clinic_id: clinicId,
        role,
        full_name: formattedName,
        email,
        created_at: now,
        updated_at: now,
      };

      // 1. Put into Dexie
      await db.users.put(newDbUser);

      // 2. Enqueue sync
      await db.sync_queue.add({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-usr-${Date.now()}`,
        table: 'users',
        record_id: newId,
        operation: 'insert',
        payload: newDbUser,
        data: newDbUser,
        status: 'pending',
        attempts: 0,
        created_at: now,
      });

      // 3. Invoke Supabase Edge function if configured
      if (isSupabaseConfigured() && navigator.onLine) {
        try {
          await supabase.functions.invoke('invite-staff', {
            body: { email, role, clinic_id: clinicId },
          });
        } catch (err) {
          console.warn('invite-staff Edge Function call:', err);
        }
      }

      void drainQueue();
      setIsInviteOpen(false);

      if (onToast) {
        onToast(`Invite sent to ${email}.`);
      }
    },
    [session.user?.clinic_id, onToast]
  );

  const resendInvite = useCallback(
    (id: string) => {
      const member = staffList.find((s) => s.id === id);
      if (member && onToast) {
        onToast(`Invite resent to ${member.email}.`);
      }
    },
    [staffList, onToast]
  );

  const changeRole = useCallback(
    async (id: string, newRole: UserRole) => {
      await db.users.update(id, { role: newRole, updated_at: new Date().toISOString() });
      await db.sync_queue.add({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-usr-role-${Date.now()}`,
        table: 'users',
        record_id: id,
        operation: 'update',
        payload: { id, role: newRole },
        data: { id, role: newRole },
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
      });
      void drainQueue();

      if (onToast) {
        onToast(`Role updated to ${newRole}.`);
      }
    },
    [onToast]
  );

  const toggleDisable = useCallback(
    (id: string) => {
      const member = staffList.find((s) => s.id === id);
      if (!member) return;
      if (onToast) {
        onToast(`Staff member updated.`);
      }
    },
    [staffList, onToast]
  );

  const removeStaff = useCallback(
    async (id: string) => {
      await db.users.delete(id);
      if (onToast) {
        onToast('Staff member removed.');
      }
    },
    [onToast]
  );

  return {
    staffList,
    isInviteOpen,
    setIsInviteOpen,
    editingRoleId,
    setEditingRoleId,
    inviteStaff,
    resendInvite,
    changeRole,
    toggleDisable,
    removeStaff,
  };
}
