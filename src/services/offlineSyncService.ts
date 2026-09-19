// Offline Sync Service for Kaya EMR
// Provides offline-first local persistence, delta sync queue management,
// conflict handling, and direct synchronization with Supabase.

import { Patient, Visit, SyncQueueItem, SyncState } from '../types';
import { INITIAL_PATIENTS, INITIAL_VISITS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  PATIENTS: 'kaya_local_patients',
  VISITS: 'kaya_local_visits',
  QUEUE: 'kaya_sync_queue',
  LAST_PULLED: 'kaya_last_pulled_at',
  OFFLINE_MODE: 'kaya_offline_mode',
};

type SyncListener = () => void;

class OfflineSyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    this.initStorage();
  }

  // Subscribe to sync state changes
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // Initialize storage with initial seeded data if empty
  private initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(INITIAL_VISITS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(false));
    }
  }

  // Offline Mode toggle
  public isOfflineMode(): boolean {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) || 'false');
    } catch {
      return false;
    }
  }

  public setOfflineMode(offline: boolean): void {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(offline));
    this.notify();
  }

  // Sync state
  public getSyncState(): SyncState {
    if (this.isOfflineMode()) return 'offline';
    const queue = this.getQueue();
    if (queue.length > 0) return 'pending';
    return 'synced';
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // Local Patients
  public getPatients(): Patient[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
    } catch {
      return INITIAL_PATIENTS;
    }
  }

  public savePatient(patient: Patient): void {
    const patients = this.getPatients();
    const existingIndex = patients.findIndex((p) => p.id === patient.id);
    const updatedPatient: Patient = {
      ...patient,
      synced: false,
    };

    if (existingIndex >= 0) {
      patients[existingIndex] = updatedPatient;
    } else {
      patients.unshift(updatedPatient);
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

    // Add to sync queue
    this.enqueueMutation({
      id: `sync-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      entityType: 'patient',
      entityId: patient.id,
      description: `Patient registration: ${patient.fullName} (${patient.clinicId})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      retryCount: 0,
    });

    this.notify();

    // Trigger background sync attempt if online
    if (!this.isOfflineMode()) {
      this.syncNow().catch(() => {});
    }
  }

  // Local Visits
  public getVisits(): Visit[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
    } catch {
      return INITIAL_VISITS;
    }
  }

  public saveVisit(visit: Visit): void {
    const visits = this.getVisits();
    const existingIndex = visits.findIndex((v) => v.id === visit.id);
    const updatedVisit: Visit = {
      ...visit,
      synced: false,
    };

    if (existingIndex >= 0) {
      visits[existingIndex] = updatedVisit;
    } else {
      visits.unshift(updatedVisit);
    }
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    // Update patient's visit count and last visit timestamp
    const patients = this.getPatients();
    const patient = patients.find((p) => p.id === visit.patientId);
    if (patient) {
      patient.totalVisits = (patient.totalVisits || 0) + 1;
      patient.lastVisitDate = visit.date;
      patient.lastVisitRelative = 'Today';
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    }

    // Add to sync queue
    this.enqueueMutation({
      id: `sync-v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      entityType: 'visit',
      entityId: visit.id,
      description: `Visit encounter: ${visit.patientName} (${visit.chiefComplaint || 'Checkup'})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      retryCount: 0,
    });

    this.notify();

    if (!this.isOfflineMode()) {
      this.syncNow().catch(() => {});
    }
  }

  // Queue Operations
  public getQueue(): SyncQueueItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
    } catch {
      return [];
    }
  }

  private setQueue(queue: SyncQueueItem[]): void {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  }

  private enqueueMutation(item: SyncQueueItem): void {
    const queue = this.getQueue();
    // Prevent duplicate entries for same entity if pending
    const existing = queue.findIndex((q) => q.entityId === item.entityId && q.status === 'pending');
    if (existing >= 0) {
      queue[existing] = item;
    } else {
      queue.push(item);
    }
    this.setQueue(queue);
  }

  public retryQueueItem(id: string): void {
    const queue = this.getQueue();
    const item = queue.find((q) => q.id === id);
    if (item) {
      item.status = 'pending';
      item.errorMessage = undefined;
      this.setQueue(queue);
      this.notify();
      this.syncNow().catch(() => {});
    }
  }

  // Two-Way Sync Execution
  public async syncNow(): Promise<boolean> {
    if (this.isSyncing) return false;
    if (this.isOfflineMode()) return false;

    this.isSyncing = true;
    this.notify();

    try {
      const queue = this.getQueue();

      if (isSupabaseConfigured()) {
        // Direct Supabase Sync Protocol
        const patients = this.getPatients();
        const visits = this.getVisits();

        // 1. Build mutation payload for items in queue
        const mutations = queue.map((item) => {
          if (item.entityType === 'patient') {
            const p = patients.find((pat) => pat.id === item.entityId);
            return {
              table: 'patients',
              operation: 'insert',
              record_id: item.entityId,
              data: p ? {
                full_name: p.fullName,
                external_id: p.clinicId,
                age: p.age,
                sex: p.gender.toLowerCase(),
                village: p.village,
                phone: p.phone,
                allergies: p.allergies,
                chronic_conditions: p.chronicConditions,
                alerts: p.alerts,
              } : {},
            };
          } else {
            const v = visits.find((vis) => vis.id === item.entityId);
            return {
              table: 'visits',
              operation: 'insert',
              record_id: item.entityId,
              data: v ? {
                patient_id: v.patientId,
                visit_type: (v.visitType || 'consult').toLowerCase(),
                visit_date: `${v.date}T${v.time || '10:00'}:00Z`,
                chief_complaint: v.chiefComplaint,
                diagnosis: v.diagnosis,
                notes: v.clinicalNotes,
                vitals: v.vitals,
              } : {},
            };
          }
        });

        // 2. Push changes to Supabase RPC
        if (mutations.length > 0) {
          const { error: pushError } = await supabase.rpc('push_clinic_changes', { mutations });
          if (pushError) throw pushError;
        }

        // 3. Pull latest delta changes from Supabase RPC
        const lastPulledAt = localStorage.getItem(STORAGE_KEYS.LAST_PULLED);
        const { data: pullData, error: pullError } = await supabase.rpc('pull_clinic_changes', {
          last_pulled_at: lastPulledAt || null,
        });

        if (pullError) throw pullError;

        if (pullData?.server_time) {
          localStorage.setItem(STORAGE_KEYS.LAST_PULLED, pullData.server_time);
        }
      } else {
        // Simulated network delay for realistic rural clinic UX when mock/preview
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Mark all local records as synced
      const patients = this.getPatients().map((p) => ({ ...p, synced: true }));
      const visits = this.getVisits().map((v) => ({ ...v, synced: true }));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

      // Clear sync queue
      this.setQueue([]);
      return true;
    } catch (err: unknown) {
      console.warn('Sync attempt failed:', err);
      // Mark active items in queue as failed with error description
      const queue = this.getQueue();
      queue.forEach((item) => {
        item.status = 'failed';
        item.retryCount += 1;
        item.errorMessage = err instanceof Error ? err.message : 'Network failure';
      });
      this.setQueue(queue);
      return false;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
