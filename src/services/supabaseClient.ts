// Supabase Client for Kaya EMR
// Offline-first rural clinic application talking directly to Supabase.
// Handles connection status, auth token persistence, and RPC invocations.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read env variables (supporting both Vite client-side and server-side conventions)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('placeholder-project') &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes('placeholder-anon-key')
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
  },
});
