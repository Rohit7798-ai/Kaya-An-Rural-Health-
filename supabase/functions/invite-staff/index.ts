// Supabase Edge Function: invite-staff
// Invites a new staff member and creates corresponding public.users entry.
// Requires caller to have role = 'admin' in the clinic.

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // 1. Client with caller's token to get user id
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerAuthUser }, error: authError } = await callerClient.auth.getUser();

    if (authError || !callerAuthUser) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller role and clinic
    const { data: callerUser, error: callerError } = await adminClient
      .from('users')
      .select('clinic_id, role, full_name')
      .eq('id', callerAuthUser.id)
      .is('deleted_at', null)
      .single();

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Caller record not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (callerUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only clinic administrators can invite staff' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, role, full_name } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validRoles = ['admin', 'clinician', 'health_worker', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role: ${role}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create or invite the auth user via Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        clinic_id: callerUser.clinic_id,
        role,
      },
    });

    if (inviteError || !inviteData.user) {
      return new Response(JSON.stringify({ error: inviteError?.message ?? 'Failed to invite user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = inviteData.user.id;
    const nameToUse = full_name?.trim() || email.split('@')[0];

    // 4. Insert row into public.users
    const { error: insertError } = await adminClient
      .from('users')
      .upsert({
        id: newUserId,
        clinic_id: callerUser.clinic_id,
        full_name: nameToUse,
        role,
        last_active_at: null,
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Log operation to sync_log
    await adminClient.from('sync_log').insert({
      clinic_id: callerUser.clinic_id,
      user_id: callerAuthUser.id,
      table_name: 'users',
      record_id: newUserId,
      operation: 'insert',
      status: 'ok',
      error_message: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        email,
        role,
        clinic_id: callerUser.clinic_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
