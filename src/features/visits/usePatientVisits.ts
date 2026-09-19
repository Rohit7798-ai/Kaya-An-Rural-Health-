// Dexie-backed Patient Visits Hook
// Fetches visits and nested prescriptions reactively from local Dexie database.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Visit, PrescriptionItem } from '../../types';

export type VisitWithRx = Visit & { prescriptions: PrescriptionItem[] };

export interface UsePatientVisitsResult {
  visits: VisitWithRx[];
  isLoading: boolean;
  loading: boolean;
  error: Error | null;
}

export function usePatientVisits(patientId?: string): UsePatientVisitsResult {
  const visits = useLiveQuery(async () => {
    if (!patientId || patientId === 'empty' || patientId === 'P-0000' || patientId === 'empty-patient' || patientId === 'not-found') {
      return [];
    }

    // Fetch visits where deleted_at is null
    const rawVisits = await db.visits
      .filter((v) => !v.deleted_at && (v.patient_id === patientId || v.patientId === patientId || v.patientClinicId === patientId))
      .toArray();

    if (rawVisits.length === 0) {
      return [];
    }

    // Sort by visit_date DESC (or date DESC)
    rawVisits.sort((a, b) => {
      const dateA = a.visit_date || a.date || '';
      const dateB = b.visit_date || b.date || '';
      return dateB.localeCompare(dateA);
    });

    // For each visit, fetch its prescriptions where deleted_at is null, sorted by position ASC
    const visitsWithRx: VisitWithRx[] = await Promise.all(
      rawVisits.map(async (v) => {
        const rxList = await db.prescriptions
          .filter((rx) => !rx.deleted_at && rx.visit_id === v.id)
          .toArray();

        rxList.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        const prescriptions: PrescriptionItem[] = rxList.map((rx) => ({
          id: rx.id,
          medication: rx.medication || rx.medicine || '',
          dosage: rx.dosage || rx.dose || '',
          frequency: rx.frequency || '',
          durationDays: rx.durationDays || rx.duration_value || 7,
          instructions: rx.instructions || '',
        }));

        return {
          ...v,
          prescriptions,
        };
      })
    );

    return visitsWithRx;
  }, [patientId]);

  const isLoading = visits === undefined;

  return {
    visits: visits ?? [],
    isLoading,
    loading: isLoading,
    error: null,
  };
}
