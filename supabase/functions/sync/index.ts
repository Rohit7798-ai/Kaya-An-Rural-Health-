// Supabase Edge Function: sync
// Provides a unified two-way delta sync endpoint for offline-first rural clinics.
// Accepts queued offline mutations, commits them atomically, and returns all remote changes
// since the client's last_pulled_at timestamp in a single round-trip.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Initialize Supabase client scoped to caller's JWT token
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { last_pulled_at, mutations } = body;

    let pushResult = null;

    // 1. Process client mutations if present
    if (Array.isArray(mutations) && mutations.length > 0) {
      const { data, error: pushErr } = await client.rpc('push_clinic_changes', {
        mutations,
      });

      if (pushErr) {
        return new Response(JSON.stringify({ error: `Push failed: ${pushErr.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      pushResult = data;
    }

    // 2. Pull latest server deltas
    const { data: pullResult, error: pullErr } = await client.rpc('pull_clinic_changes', {
      last_pulled_at: last_pulled_at || null,
    });

    if (pullErr) {
      return new Response(JSON.stringify({ error: `Pull failed: ${pullErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        pushed: pushResult,
        pulled: pullResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal sync error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
