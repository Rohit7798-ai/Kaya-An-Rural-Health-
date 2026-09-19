export type ScreenType = 
  | 'today'
  | 'patients'
  | 'patient-profile'
  | 'new-patient'
  | 'visit-notes'
  | 'visits'
  | 'reports'
  | 'settings';

export type SyncState = 'synced' | 'pending' | 'offline';

export interface Vitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseBpm?: number;
  tempCelsius?: number;
  spo2Percent?: number;
  weightKg?: number;
}

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export type VisitType = 'CONSULT' | 'LAB' | 'RX';

export interface VisitAttachment {
  id: string;
  name: string;
  type?: 'pdf' | 'image';
  imageUrl?: string;
  ocrText?: string;
  confirmed?: boolean;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  patientClinicId: string;
  date: string; // ISO date string e.g. "2026-09-14"
  time: string; // e.g. "10:24"
  clinicianName: string;
  clinicianRole: 'Doctor' | 'Nurse' | 'Community Health Worker';
  status: 'Waiting' | 'In Consultation' | 'Completed';
  visitType?: VisitType;
  chiefComplaint: string;
  vitals: Vitals;
  diagnosis: string;
  icdCode?: string;
  clinicalNotes: string; // Serif text
  prescriptions: PrescriptionItem[];
  prescriptionText?: string; // Formatted prescription text
  attachments?: VisitAttachment[];
  synced: boolean;
  lastModified: string;
}

export interface PatientAlert {
  id: string;
  label: string;
  type: 'danger' | 'warning' | 'info';
}

export interface Patient {
  id: string;
  clinicId: string; // e.g. "P-0412" or "KAY-2026-0142"
  nationalId?: string;
  fullName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  village: string;
  phone: string;
  bloodGroup?: string;
  allergies?: string;
  alerts?: PatientAlert[];
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  registeredDate: string;
  firstSeenDate?: string;
  lastVisitDate?: string;
  lastVisitRelative?: string;
  totalVisits: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'patient' | 'visit';
  entityId: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  errorMessage?: string;
}

export interface ClinicConfig {
  name: string;
  facilityCode: string;
  district: string;
  subCentre: string;
  inChargeDoctor: string;
  offlineMode: boolean;
  lastSyncedTimestamp: string;
}

export interface StaffUser {
  id: string;
  name: string;
  role: string;
  pin: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}
