// Dexie-backed Patient Form Hook
// Offline-first write path: Dexie put -> sync_queue enqueue -> fire-and-forget drainQueue().

import { useState, useEffect, useRef, useCallback } from 'react';
import { db, DbPatient } from '../../lib/db';
import { drainQueue } from '../../lib/sync';
import { sessionStore } from '../../state/session';

export interface PatientFormData {
  fullName: string;
  age: string;
  gender: 'Female' | 'Male' | 'Other' | '';
  village: string;
  phone: string;
  emergencyContact: string;
  address: string;
  allergies: string;
  chronicConditions: string;
  notes: string;
  legacyId: string;
}

export const INITIAL_FORM_DATA: PatientFormData = {
  fullName: '',
  age: '',
  gender: '',
  village: '',
  phone: '',
  emergencyContact: '',
  address: '',
  allergies: '',
  chronicConditions: '',
  notes: '',
  legacyId: '',
};

const DRAFT_STORAGE_KEY = 'kaya_new_patient_draft';

function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function usePatientForm() {
  const [formData, setFormData] = useState<PatientFormData>(INITIAL_FORM_DATA);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Existing draft detected on mount
  const [draftPrompt, setDraftPrompt] = useState<{ time: string; data: PatientFormData } | null>(null);

  // Check for stored draft on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data && (parsed.data.fullName || parsed.data.age || parsed.data.village)) {
          setDraftPrompt({
            time: parsed.savedAt || 'earlier',
            data: parsed.data,
          });
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

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
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setDraftPrompt(null);
    setFormData(INITIAL_FORM_DATA);
    setIsDirty(false);
    setAutosaveStatus('idle');
    setLastSavedTime(null);
  }, []);

  const updateField = useCallback(<K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
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

  // 3s interval autosave if dirty
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDirtyRef.current) return;
      const data = formDataRef.current;
      const hasContent = data.fullName.trim() || data.age.trim() || data.village.trim() || data.phone.trim();
      if (!hasContent) return;

      setAutosaveStatus('saving');
      const saveTimer = setTimeout(() => {
        const timeStr = formatCurrentTime();
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
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

      return () => clearTimeout(saveTimer);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const validate = useCallback((): { isValid: boolean; firstErrorField: string | null } => {
    const newErrors: Record<string, string> = {};
    let firstField: string | null = null;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
      if (!firstField) firstField = 'fullName';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required.';
      if (!firstField) firstField = 'age';
    } else {
      const numAge = Number(formData.age);
      if (isNaN(numAge) || numAge < 0 || numAge > 120) {
        newErrors.age = 'Enter a valid age between 0 and 120.';
        if (!firstField) firstField = 'age';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select sex.';
      if (!firstField) firstField = 'gender';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorField: firstField,
    };
  }, [formData]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsDirty(false);
    setAutosaveStatus('idle');
  }, []);

  // Submit patient write path
  const submitPatientForm = useCallback(async (clinicIdOverride?: string): Promise<{ id: string }> => {
    const session = sessionStore.getState();
    const clinicId = clinicIdOverride || session.user?.clinic_id || 'cln-wardha-01';
    const now = new Date().toISOString();
    const patientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pat-${Date.now()}`;
    const generatedClinicId = formData.legacyId || `P-${Math.floor(1000 + Math.random() * 9000)}`;

    const patient: DbPatient = {
      id: patientId,
      clinicId: generatedClinicId,
      external_id: generatedClinicId,
      clinic_id: clinicId,
      fullName: formData.fullName.trim(),
      full_name: formData.fullName.trim(),
      age: parseInt(formData.age, 10) || 0,
      gender: (formData.gender as 'Female' | 'Male' | 'Other') || 'Other',
      village: formData.village.trim(),
      phone: formData.phone.trim(),
      allergies: formData.allergies.trim() || undefined,
      chronicConditions: formData.chronicConditions.trim() || undefined,
      emergencyContactName: formData.emergencyContact.trim() || undefined,
      emergencyContactPhone: formData.emergencyContact.trim() || undefined,
      registeredDate: now.split('T')[0],
      totalVisits: 0,
      alerts: [],
      sync_state: 'pending',
      synced: false,
      created_at: now,
      updated_at: now,
    };

    // 1. Write to Dexie
    await db.patients.put(patient);

    // 2. Enqueue to sync_queue
    const queueItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-${Date.now()}`,
      table: 'patients',
      record_id: patient.id,
      operation: 'insert' as const,
      payload: patient,
      data: patient,
      status: 'pending' as const,
      attempts: 0,
      created_at: now,
    };
    await db.sync_queue.add(queueItem);

    // 3. Clear draft
    clearDraft();

    // 4. Fire-and-forget drain queue
    void drainQueue();

    return { id: patient.id };
  }, [formData, clearDraft]);

  return {
    formData,
    setFormData,
    updateField,
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
    submitPatientForm,
  };
}
