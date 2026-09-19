// Settings Hook backed by Dexie db.clinics + CSV export + Data wipe
import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbClinic } from '../../lib/db';
import { drainQueue } from '../../lib/sync';
import { sessionStore } from '../../state/session';

export type UserRole = 'Admin' | 'Clinician' | 'Health worker' | 'Viewer';

export interface ClinicInfo {
  clinicName: string;
  facilityCode: string;
  district: string;
  state: string;
  timeZone: string;
  defaultLanguage: string;
}

const DEFAULT_CLINIC_INFO: ClinicInfo = {
  clinicName: 'Kaya Rural Clinic',
  facilityCode: 'MH-WRD-0142',
  district: 'Wardha',
  state: 'Maharashtra',
  timeZone: 'Asia/Kolkata (GMT+5:30)',
  defaultLanguage: 'English',
};

export function useSettings() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [hasError, setHasError] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read clinic from db.clinics
  const clinicRow = useLiveQuery(async () => {
    return db.clinics.toCollection().first();
  }, []);

  const clinicInfo: ClinicInfo = {
    clinicName: clinicRow?.name || DEFAULT_CLINIC_INFO.clinicName,
    facilityCode: clinicRow?.facility_code || DEFAULT_CLINIC_INFO.facilityCode,
    district: clinicRow?.district || DEFAULT_CLINIC_INFO.district,
    state: clinicRow?.state || DEFAULT_CLINIC_INFO.state,
    timeZone: DEFAULT_CLINIC_INFO.timeZone,
    defaultLanguage: DEFAULT_CLINIC_INFO.defaultLanguage,
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const saveClinicInfo = useCallback(
    async (newInfo: ClinicInfo): Promise<{ success: boolean; error?: string }> => {
      if (!newInfo.clinicName.trim()) {
        return { success: false, error: 'Clinic name is required.' };
      }
      if (!newInfo.facilityCode.trim()) {
        return { success: false, error: 'Facility code is required.' };
      }

      const clinicId = clinicRow?.id || 'cln-wardha-01';
      const now = new Date().toISOString();

      const record: DbClinic = {
        id: clinicId,
        name: newInfo.clinicName.trim(),
        facility_code: newInfo.facilityCode.trim(),
        district: newInfo.district.trim(),
        state: newInfo.state.trim(),
        updated_at: now,
      };

      // 1. Put into Dexie
      await db.clinics.put(record);

      // 2. Enqueue sync op
      await db.sync_queue.add({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-cln-${Date.now()}`,
        table: 'clinics',
        record_id: clinicId,
        operation: 'update',
        payload: record,
        data: record,
        status: 'pending',
        attempts: 0,
        created_at: now,
      });

      // 3. Fire-and-forget drainQueue
      void drainQueue();

      showToast('Clinic info saved.');
      return { success: true };
    },
    [clinicRow, showToast]
  );

  // Client-side CSV export from Dexie
  const exportPatientsCsv = useCallback(async () => {
    const patients = await db.patients.filter((p) => !p.deleted_at).toArray();
    const headers = 'Clinic ID,Full Name,Age,Gender,Village,Phone,Allergies,Total Visits,Registered Date\n';
    const rows = patients.map((p) =>
      `"${p.clinicId || p.external_id || p.id}","${p.fullName || p.full_name || ''}",${p.age || ''},"${p.gender || ''}","${p.village || ''}","${p.phone || ''}","${p.allergies || ''}",${p.totalVisits || 0},"${p.registeredDate || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kaya-patients-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Patients exported.');
  }, [showToast]);

  const exportVisitsCsv = useCallback(async () => {
    const visits = await db.visits.filter((v) => !v.deleted_at).toArray();
    const headers = 'Visit ID,Date,Patient ID,Patient Name,Clinician,Complaint,Diagnosis\n';
    const rows = visits.map((v) =>
      `"${v.id}","${v.date || v.visit_date || ''}","${v.patientId || v.patient_id || ''}","${v.patientName || ''}","${v.clinicianName || ''}","${(v.chiefComplaint || '').replace(/"/g, '""')}","${(v.diagnosis || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kaya-visits-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Visits exported.');
  }, [showToast]);

  // Delete all data & sign out
  const resetAllData = useCallback(async () => {
    await sessionStore.signOut();
  }, []);

  return {
    clinicInfo,
    saveClinicInfo,
    currentUserRole,
    setCurrentUserRole,
    isOffline,
    setIsOffline,
    hasError,
    setHasError,
    toastMessage,
    showToast,
    resetAllData,
    exportPatientsCsv,
    exportVisitsCsv,
  };
}
