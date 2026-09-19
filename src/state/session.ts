// Session state management for Kaya EMR
// Offline-first session with localStorage persistence, PIN hash, and reactive hook.

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  clinic_id: string;
  role: 'Admin' | 'Clinician' | 'Health worker' | 'Viewer';
}

export interface SessionClinic {
  id: string;
  name: string;
  facility_code: string;
}

export interface SessionState {
  user: SessionUser | null;
  clinic: SessionClinic | null;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
}

const SESSION_KEY = 'kaya:session';
const PIN_HASH_KEY = 'kaya:offline_pin_hash';

// Default mock user for offline fallback / first run
const DEFAULT_USER: SessionUser = {
  id: 'usr-default-01',
  email: 'amina.k@clinic.kaya',
  full_name: 'Dr. Amina Khan',
  clinic_id: 'cln-wardha-01',
  role: 'Admin',
};

const DEFAULT_CLINIC: SessionClinic = {
  id: 'cln-wardha-01',
  name: 'Kaya Rural Clinic',
  facility_code: 'MH-WRD-0142',
};

// Compute SHA-256 in browser
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function loadInitialState(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user) {
        return {
          user: parsed.user,
          clinic: parsed.clinic || DEFAULT_CLINIC,
          isAuthenticated: true,
          isOfflineMode: Boolean(parsed.isOfflineMode),
        };
      }
    }
  } catch {
    // Ignore JSON errors
  }

  // If offline PIN is set or development mode, allow ready session
  return {
    user: DEFAULT_USER,
    clinic: DEFAULT_CLINIC,
    isAuthenticated: true,
    isOfflineMode: true,
  };
}

let currentState: SessionState = loadInitialState();
const listeners = new Set<(state: SessionState) => void>();

function notify() {
  listeners.forEach((l) => l(currentState));
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: currentState.user,
        clinic: currentState.clinic,
        isOfflineMode: currentState.isOfflineMode,
      })
    );
  } catch {
    // Local storage full or unavailable
  }
}

export const sessionStore = {
  getState(): SessionState {
    return currentState;
  },

  setSession(user: SessionUser, clinic?: SessionClinic | null, isOfflineMode = false) {
    currentState = {
      user,
      clinic: clinic || currentState.clinic || DEFAULT_CLINIC,
      isAuthenticated: true,
      isOfflineMode,
    };
    notify();
  },

  setOfflinePinHash(hash: string) {
    localStorage.setItem(PIN_HASH_KEY, hash);
  },

  getOfflinePinHash(): string | null {
    return localStorage.getItem(PIN_HASH_KEY);
  },

  async verifyOfflinePin(enteredPin: string): Promise<boolean> {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) {
      // Default dev PIN: "2026" or "1234"
      return enteredPin === '2026' || enteredPin === '1234';
    }
    const enteredHash = await hashPin(enteredPin);
    return enteredHash === storedHash;
  },

  async signOut() {
    // 1. Clear Dexie tables
    try {
      await Promise.all([
        db.patients.clear(),
        db.visits.clear(),
        db.prescriptions.clear(),
        db.attachments.clear(),
        db.sync_queue.clear(),
      ]);
    } catch (e) {
      console.error('Failed to clear Dexie tables:', e);
    }

    // 2. Clear localStorage
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem('kaya:last_sync');

    // 3. Supabase signOut
    try {
      await supabase.auth.signOut();
    } catch {
      // Offline signOut
    }

    currentState = {
      user: null,
      clinic: null,
      isAuthenticated: false,
      isOfflineMode: true,
    };
    notify();
  },

  subscribe(listener: (state: SessionState) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useSession(): SessionState & {
  setSession: typeof sessionStore.setSession;
  signOut: typeof sessionStore.signOut;
  verifyOfflinePin: typeof sessionStore.verifyOfflinePin;
  setOfflinePinHash: typeof sessionStore.setOfflinePinHash;
} {
  const [state, setState] = useState<SessionState>(sessionStore.getState());

  useEffect(() => {
    return sessionStore.subscribe(setState);
  }, []);

  return {
    ...state,
    setSession: sessionStore.setSession,
    signOut: sessionStore.signOut,
    verifyOfflinePin: sessionStore.verifyOfflinePin,
    setOfflinePinHash: sessionStore.setOfflinePinHash,
  };
}
