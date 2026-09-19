// Dexie Database Schema for Kaya EMR
// Offline-first local database acting as single source of truth on the client.

import Dexie, { Table } from 'dexie';
import { Patient, Visit } from '../types';

export interface Prescription {
  id: string;
  visit_id: string;
  clinic_id?: string;
  medication: string;
  medicine?: string;
  dosage: string;
  dose?: string;
  frequency: string;
  durationDays: number;
  duration_value?: number;
  duration_unit?: string;
  instructions?: string;
  position: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DbPatient extends Patient {
  clinic_id?: string;
  external_id?: string;
  full_name?: string;
  sync_state?: 'synced' | 'pending' | 'waiting_upload' | 'failed';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DbVisit extends Visit {
  clinic_id?: string;
  patient_id?: string;
  visit_date?: string;
  sync_state?: 'synced' | 'pending' | 'waiting_upload' | 'failed';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DbAttachment {
  id: string;
  clinic_id?: string;
  patient_id?: string;
  visit_id?: string;
  filename: string;
  file_size?: number;
  mime_type?: string;
  sha256?: string;
  ocr_status: 'pending' | 'ready' | 'waiting_upload' | 'failed' | 'confirmed';
  ocr_text?: string;
  ocr_confidence?: number;
  sync_state: 'synced' | 'pending' | 'waiting_upload' | 'failed';
  local_path?: string; // in-memory Object URL preview
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DbClinic {
  id: string;
  name: string;
  facility_code: string;
  district?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbUser {
  id: string;
  clinic_id: string;
  role: 'Admin' | 'Clinician' | 'Health worker' | 'Viewer';
  full_name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncQueueRow {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  payload?: unknown;
  data?: unknown;
  created_at: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  attempts: number;
  retry_count?: number;
  error_message?: string;
}

export class KayaDatabase extends Dexie {
  patients!: Table<DbPatient, string>;
  visits!: Table<DbVisit, string>;
  prescriptions!: Table<Prescription, string>;
  attachments!: Table<DbAttachment, string>;
  clinics!: Table<DbClinic, string>;
  users!: Table<DbUser, string>;
  sync_queue!: Table<SyncQueueRow, string>;

  constructor() {
    super('kaya_emr_db');
    this.version(2).stores({
      patients: 'id, clinic_id, external_id, full_name, village, phone, updated_at, deleted_at',
      visits: 'id, patient_id, clinic_id, visit_date, deleted_at, updated_at',
      prescriptions: 'id, visit_id, clinic_id, position, deleted_at',
      attachments: 'id, clinic_id, patient_id, visit_id, sha256, ocr_status, sync_state, created_at',
      clinics: 'id, name, facility_code',
      users: 'id, clinic_id, role, full_name',
      sync_queue: 'id, table, operation, record_id, status, attempts, created_at',
    });
  }
}

export const db = new KayaDatabase();
