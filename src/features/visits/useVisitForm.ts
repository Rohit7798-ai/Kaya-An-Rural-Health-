// Dexie-backed Visit Form Hook
// Offline-first write path: Dexie atomic transaction -> sync_queue enqueue -> fire-and-forget drainQueue().

import { useState, useEffect, useRef, useCallback } from 'react';
import { db, DbVisit, Prescription } from '../../lib/db';
import { drainQueue } from '../../lib/sync';
import { sessionStore } from '../../state/session';
import { Patient } from '../../types';

export interface PrescriptionRowItem {
  id: string;
  medicine: string;
  dose: string;
  frequency: 'OD' | 'BD' | 'TDS' | 'QID' | 'PRN' | 'Other';
  durationValue: string;
  durationUnit: 'days' | 'weeks';
}

export interface VisitFormData {
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  visitType: 'Consultation' | 'Follow-up' | 'Emergency';
  seenBy: string;
  chiefComplaint: string;
  durationValue: string;
  durationUnit: 'days' | 'weeks' | 'months';
  presentingNotes: string;
  bp: string; // e.g. "128/82"
  pulse: string; // e.g. "78"
  temp: string; // e.g. "36.8"
  weight: string; // e.g. "61"
  diagnosis: string;
  icdCode: string;
  assessmentNotes: string;
  prescriptions: PrescriptionRowItem[];
  nextVisitDate: string;
  reminderNote: string;
  printFollowUpSlip: boolean;
}

export function getNowDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export const createEmptyPrescriptionRow = (): PrescriptionRowItem => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  medicine: '',
  dose: '',
  frequency: 'OD',
  durationValue: '7',
  durationUnit: 'days',
});

export const INITIAL_VISIT_FORM_DATA: VisitFormData = {
  visitDate: getNowDateTime().date,
  visitTime: getNowDateTime().time,
  visitType: 'Follow-up',
  seenBy: 'Dr. Ramesh Rao',
  chiefComplaint: '',
  durationValue: '3',
  durationUnit: 'days',
  presentingNotes: '',
  bp: '',
  pulse: '',
  temp: '',
  weight: '',
  diagnosis: '',
  icdCode: '',
  assessmentNotes: '',
  prescriptions: [createEmptyPrescriptionRow()],
  nextVisitDate: '',
  reminderNote: '',
  printFollowUpSlip: false,
};

function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function useVisitForm(patientId: string) {
  const storageKey = `kaya_new_visit_draft_${patientId || 'default'}`;

  const [formData, setFormData] = useState<VisitFormData>(INITIAL_VISIT_FORM_DATA);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Stored draft prompt
  const [draftPrompt, setDraftPrompt] = useState<{ time: string; data: VisitFormData } | null>(null);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data && (parsed.data.chiefComplaint || parsed.data.presentingNotes || parsed.data.diagnosis)) {
          setDraftPrompt({
            time: parsed.savedAt || 'earlier',
            data: parsed.data,
          });
        }
      }
    } catch {
      // Ignore parse error
    }
  }, [storageKey]);

  const resumeDraft = useCallback(() => {
    if (draftPrompt) {
      setFormData(draftPrompt.data);
      setIsDirty(true);
      setLastSavedTime(draftPrompt.time);
      setAutosaveStatus('saved');
      setDraftPrompt(null);
    }
  }, [draftPrompt]);

  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setDraftPrompt(null);
    setFormData(INITIAL_VISIT_FORM_DATA);
    setIsDirty(false);
    setAutosaveStatus('idle');
    setLastSavedTime(null);
  }, [storageKey]);

  const updateField = useCallback(<K extends keyof VisitFormData>(field: K, value: VisitFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const addPrescriptionRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: [...prev.prescriptions, createEmptyPrescriptionRow()],
    }));
    setIsDirty(true);
  }, []);

  const updatePrescriptionRow = useCallback(
    (id: string, updates: Partial<PrescriptionRowItem>) => {
      setFormData((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((row) => (row.id === id ? { ...row, ...updates } : row)),
      }));
      setIsDirty(true);
    },
    []
  );

  const removePrescriptionRow = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.prescriptions.length <= 1) {
        return {
          ...prev,
          prescriptions: [createEmptyPrescriptionRow()],
        };
      }
      return {
        ...prev,
        prescriptions: prev.prescriptions.filter((row) => row.id !== id),
      };
    });
    setIsDirty(true);
  }, []);

  // Autosave timer every 3s if dirty
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDirtyRef.current) return;
      const data = formDataRef.current;
      const hasContent =
        data.chiefComplaint.trim() ||
        data.presentingNotes.trim() ||
        data.diagnosis.trim() ||
        data.bp.trim() ||
        data.pulse.trim();

      if (!hasContent) return;

      setAutosaveStatus('saving');
      const saveTimeout = setTimeout(() => {
        const timeStr = formatCurrentTime();
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              data,
              savedAt: timeStr,
            })
          );
          setLastSavedTime(timeStr);
          setAutosaveStatus('saved');
        } catch {
          setAutosaveStatus('idle');
        }
      }, 350);

      return () => clearTimeout(saveTimeout);
    }, 3000);

    return () => clearInterval(timer);
  }, [storageKey]);

  // Validation
  const validate = useCallback((): { isValid: boolean; firstErrorField: string | null } => {
    const newErrors: Record<string, string> = {};
    let firstField: string | null = null;

    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required.';
      firstField = 'chiefComplaint';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorField: firstField,
    };
  }, [formData.chiefComplaint]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setIsDirty(false);
    setAutosaveStatus('idle');
  }, [storageKey]);

  // Submit visit write path
  const submitVisit = useCallback(
    async (
      visitStatus: 'Draft' | 'Completed',
      patient?: Patient | null
    ): Promise<{ visitId: string }> => {
      const session = sessionStore.getState();
      const clinicId = session.user?.clinic_id || 'cln-wardha-01';
      const visitId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vis-${Date.now()}`;
      const now = new Date().toISOString();

      const bpParts = (formData.bp || '').split('/');
      const bpSys = parseInt(bpParts[0], 10) || undefined;
      const bpDia = parseInt(bpParts[1], 10) || undefined;

      const visit: DbVisit = {
        id: visitId,
        clinic_id: clinicId,
        patient_id: patient?.id || patientId,
        patientId: patient?.id || patientId,
        patientName: patient?.fullName || 'Patient',
        patientClinicId: patient?.clinicId || patientId,
        visit_date: formData.visitDate || now.split('T')[0],
        date: formData.visitDate || now.split('T')[0],
        time: formData.visitTime || now.substring(11, 16),
        clinicianName: formData.seenBy || session.user?.full_name || 'Dr. Ramesh Rao',
        clinicianRole: 'Doctor',
        status: visitStatus === 'Completed' ? 'Completed' : 'Waiting',
        visitType: 'CONSULT',
        chiefComplaint: formData.chiefComplaint.trim(),
        vitals: {
          bloodPressureSystolic: bpSys,
          bloodPressureDiastolic: bpDia,
          pulseBpm: parseInt(formData.pulse, 10) || undefined,
          tempCelsius: parseFloat(formData.temp) || undefined,
          weightKg: parseFloat(formData.weight) || undefined,
        },
        diagnosis: formData.diagnosis.trim(),
        icdCode: formData.icdCode.trim() || undefined,
        clinicalNotes: formData.assessmentNotes.trim() || formData.presentingNotes.trim() || '',
        prescriptions: [],
        sync_state: 'pending',
        synced: false,
        lastModified: now,
        created_at: now,
        updated_at: now,
      };

      // Create prescription rows from form's list with UUID and position = index
      const prescriptions: Prescription[] = formData.prescriptions
        .filter((rx) => rx.medicine.trim())
        .map((rx, index) => ({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rx-${index}-${Date.now()}`,
          visit_id: visitId,
          clinic_id: clinicId,
          medication: rx.medicine.trim(),
          medicine: rx.medicine.trim(),
          dosage: rx.dose.trim(),
          dose: rx.dose.trim(),
          frequency: rx.frequency,
          durationDays: parseInt(rx.durationValue, 10) || 7,
          duration_value: parseInt(rx.durationValue, 10) || 7,
          duration_unit: rx.durationUnit || 'days',
          position: index,
          instructions: '',
          created_at: now,
          updated_at: now,
        }));

      // Atomic transaction: visit + prescriptions + sync_queue items
      await db.transaction('rw', db.visits, db.prescriptions, db.sync_queue, async () => {
        await db.visits.put(visit);
        if (prescriptions.length > 0) {
          await db.prescriptions.bulkPut(prescriptions);
        }
        await db.sync_queue.bulkAdd([
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-vis-${Date.now()}`,
            table: 'visits',
            record_id: visit.id,
            operation: 'insert',
            payload: visit,
            data: visit,
            status: 'pending',
            attempts: 0,
            created_at: now,
          },
          ...prescriptions.map((rx) => ({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-rx-${rx.id}`,
            table: 'prescriptions',
            record_id: rx.id,
            operation: 'insert' as const,
            payload: rx,
            data: rx,
            status: 'pending' as const,
            attempts: 0,
            created_at: now,
          })),
        ]);
      });

      // Fire and forget queue drain
      void drainQueue();

      // Clear draft on success
      clearDraft();

      return { visitId: visit.id };
    },
    [formData, patientId, clearDraft]
  );

  return {
    formData,
    setFormData,
    updateField,
    addPrescriptionRow,
    updatePrescriptionRow,
    removePrescriptionRow,
    isDirty,
    setIsDirty,
    errors,
    setErrors,
    autosaveStatus,
    lastSavedTime,
    draftPrompt,
    resumeDraft,
    discardDraft,
    validate,
    clearDraft,
    submitVisit,
  };
}
