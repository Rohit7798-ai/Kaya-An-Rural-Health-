// First-Load Hydrator (Supabase -> Dexie)
// Pulls clinic changes from Supabase into Dexie local database in order:
// 1. clinics, 2. users, 3. patients, 4. visits, 5. prescriptions, 6. attachments
// Skips rows where local sync_state = 'pending' (local edit wins).

import { db, DbPatient, DbVisit, Prescription, DbAttachment, DbClinic, DbUser } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

let isPulling = false;

export async function pullAll(clinicId?: string): Promise<boolean> {
  if (isPulling) return true;
  if (!isSupabaseConfigured() || !navigator.onLine) {
    return false;
  }

  isPulling = true;

  try {
    const lastPulledAt = localStorage.getItem('kaya_last_pulled_at');
    const { data, error } = await supabase.rpc('pull_clinic_changes', {
      last_pulled_at: lastPulledAt || null,
    });

    if (error) {
      console.warn('pull_clinic_changes failed:', error.message);
      return false;
    }

    if (!data) return true;

    // Cache local pending row IDs to guarantee "local edit wins"
    const pendingPatients = new Set(
      (await db.patients.filter((p) => p.sync_state === 'pending').toArray()).map((p) => p.id)
    );
    const pendingVisits = new Set(
      (await db.visits.filter((v) => v.sync_state === 'pending').toArray()).map((v) => v.id)
    );
    const pendingAttachments = new Set(
      (await db.attachments.filter((a) => a.sync_state === 'pending').toArray()).map((a) => a.id)
    );

    await db.transaction(
      'rw',
      [db.clinics, db.users, db.patients, db.visits, db.prescriptions, db.attachments],
      async () => {
        // 1. clinics
        if (Array.isArray(data.clinics)) {
          const clinicsToPut: DbClinic[] = data.clinics.map((c: any) => ({
            id: c.id,
            name: c.name || 'Kaya Rural Clinic',
            facility_code: c.facility_code || 'MH-WRD-0142',
            district: c.district,
            state: c.state,
            created_at: c.created_at,
            updated_at: c.updated_at,
          }));
          if (clinicsToPut.length > 0) {
            await db.clinics.bulkPut(clinicsToPut);
          }
        }

        // 2. users
        if (Array.isArray(data.users)) {
          const usersToPut: DbUser[] = data.users.map((u: any) => ({
            id: u.id,
            clinic_id: u.clinic_id,
            role: u.role || 'Clinician',
            full_name: u.full_name || 'Staff member',
            email: u.email,
            created_at: u.created_at,
            updated_at: u.updated_at,
          }));
          if (usersToPut.length > 0) {
            await db.users.bulkPut(usersToPut);
          }
        }

        // 3. patients (skipping local sync_state = 'pending')
        if (Array.isArray(data.patients)) {
          const patientsToPut: DbPatient[] = [];
          for (const p of data.patients) {
            if (pendingPatients.has(p.id)) continue; // Local edit wins

            patientsToPut.push({
              id: p.id,
              clinicId: p.external_id || p.clinic_id,
              clinic_id: p.clinic_id,
              external_id: p.external_id,
              fullName: p.full_name,
              full_name: p.full_name,
              age: p.age,
              gender: (p.sex === 'female' ? 'Female' : p.sex === 'male' ? 'Male' : 'Other') as 'Female' | 'Male' | 'Other',
              village: p.village,
              phone: p.phone,
              allergies: p.allergies,
              chronicConditions: p.chronic_conditions,
              emergencyContactName: p.emergency_contact,
              emergencyContactPhone: p.emergency_contact,
              registeredDate: p.created_at ? p.created_at.split('T')[0] : '2026-01-01',
              totalVisits: 0,
              sync_state: 'synced',
              synced: true,
              created_at: p.created_at,
              updated_at: p.updated_at,
              deleted_at: p.deleted_at,
            });
          }
          if (patientsToPut.length > 0) {
            await db.patients.bulkPut(patientsToPut);
          }
        }

        // 4. visits (skipping local sync_state = 'pending')
        if (Array.isArray(data.visits)) {
          const visitsToPut: DbVisit[] = [];
          for (const v of data.visits) {
            if (pendingVisits.has(v.id)) continue; // Local edit wins

            visitsToPut.push({
              id: v.id,
              patientId: v.patient_id,
              patient_id: v.patient_id,
              clinic_id: v.clinic_id,
              patientName: '',
              patientClinicId: '',
              date: v.visit_date ? v.visit_date.split('T')[0] : '2026-09-19',
              time: v.visit_date && v.visit_date.includes('T') ? v.visit_date.split('T')[1].slice(0, 5) : '10:00',
              visit_date: v.visit_date,
              clinicianName: 'Dr. Ramesh Rao',
              clinicianRole: 'Doctor',
              status: 'Completed',
              visitType: (v.visit_type?.toUpperCase() || 'CONSULT') as any,
              chiefComplaint: v.chief_complaint || '',
              vitals: v.vitals || {},
              diagnosis: v.diagnosis || '',
              clinicalNotes: v.notes || '',
              prescriptions: [],
              sync_state: 'synced',
              synced: true,
              lastModified: v.updated_at || new Date().toISOString(),
              created_at: v.created_at,
              updated_at: v.updated_at,
              deleted_at: v.deleted_at,
            });
          }
          if (visitsToPut.length > 0) {
            await db.visits.bulkPut(visitsToPut);
          }
        }

        // 5. prescriptions
        if (Array.isArray(data.prescriptions)) {
          const prescriptionsToPut: Prescription[] = data.prescriptions.map((rx: any) => ({
            id: rx.id,
            visit_id: rx.visit_id,
            clinic_id: rx.clinic_id,
            medication: rx.medicine,
            medicine: rx.medicine,
            dosage: rx.dose,
            dose: rx.dose,
            frequency: rx.frequency,
            durationDays: rx.duration_value || 7,
            duration_value: rx.duration_value,
            duration_unit: rx.duration_unit,
            position: rx.position || 0,
            created_at: rx.created_at,
            updated_at: rx.updated_at,
            deleted_at: rx.deleted_at,
          }));
          if (prescriptionsToPut.length > 0) {
            await db.prescriptions.bulkPut(prescriptionsToPut);
          }
        }

        // 6. attachments (meta only, no blobs, skipping pending)
        if (Array.isArray(data.attachments)) {
          const attachmentsToPut: DbAttachment[] = [];
          for (const a of data.attachments) {
            if (pendingAttachments.has(a.id)) continue;

            attachmentsToPut.push({
              id: a.id,
              clinic_id: a.clinic_id,
              patient_id: a.patient_id,
              visit_id: a.visit_id,
              filename: a.filename,
              file_size: a.file_size,
              mime_type: a.mime_type,
              sha256: a.sha256,
              ocr_status: a.ocr_status || 'ready',
              ocr_text: a.ocr_text,
              ocr_confidence: a.ocr_confidence,
              sync_state: 'synced',
              created_at: a.created_at,
              updated_at: a.updated_at,
              deleted_at: a.deleted_at,
            });
          }
          if (attachmentsToPut.length > 0) {
            await db.attachments.bulkPut(attachmentsToPut);
          }
        }
      }
    );

    if (data.server_time) {
      localStorage.setItem('kaya_last_pulled_at', data.server_time);
    }

    return true;
  } catch (err) {
    console.warn('pullAll error:', err);
    return false;
  } finally {
    isPulling = false;
  }
}
