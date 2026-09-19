// Dexie-backed Patient Reader Hook
// Reads single patient from local Dexie database reactively using useLiveQuery.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Patient } from '../../types';

export const SEEDED_PATIENT: Patient = {
  id: 'P-0412',
  clinicId: 'P-0412',
  fullName: 'Sunita Patil',
  age: 42,
  gender: 'Female',
  village: 'Wardha',
  phone: '+91 98721 00412',
  allergies: 'Penicillin allergy',
  chronicConditions: 'Type 2 Diabetes, Essential Hypertension',
  alerts: [
    { id: 'a1', label: 'Penicillin allergy', type: 'danger' },
    { id: 'a2', label: 'Diabetic', type: 'warning' },
  ],
  registeredDate: '2023-03-14',
  firstSeenDate: '14 Mar 2023',
  lastVisitDate: '2026-09-14',
  lastVisitRelative: '6 days ago',
  totalVisits: 7,
  synced: true,
};

export const EMPTY_PATIENT: Patient = {
  id: 'P-0000',
  clinicId: 'P-0000',
  fullName: 'Kamla Bai',
  age: 36,
  gender: 'Female',
  village: 'Jamunwadi',
  phone: '+91 94220 00018',
  allergies: undefined,
  alerts: [],
  registeredDate: '2026-09-19',
  firstSeenDate: '19 Sep 2026',
  lastVisitDate: undefined,
  lastVisitRelative: 'Never',
  totalVisits: 0,
  synced: true,
};

export interface UsePatientResult {
  patient: Patient | null;
  isLoading: boolean;
  loading: boolean;
  error: Error | null;
  isOffline: boolean;
}

export function usePatient(id?: string): UsePatientResult {
  const patient = useLiveQuery(async () => {
    if (!id || id === 'not-found') return null;

    // Search by primary id
    const match = await db.patients.get(id);
    if (match) {
      if (match.deleted_at) return null;
      return match;
    }

    // Fallback: search by external_id / clinicId
    const byExt =
      (await db.patients.where('external_id').equals(id).first()) ||
      (await db.patients.where('clinic_id').equals(id).first()) ||
      (await db.patients.filter((p) => !p.deleted_at && p.clinicId === id).first());

    if (byExt) {
      if (byExt.deleted_at) return null;
      return byExt;
    }

    return null;
  }, [id]);

  const isLoading = patient === undefined;

  return {
    patient: patient ?? null,
    isLoading,
    loading: isLoading,
    error: null,
    isOffline: true,
  };
}
