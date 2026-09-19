// Supabase Edge Function: export-clinic
// Generates and streams CSV or full backup archive data for clinic records.
// Enforces caller role = 'admin' and clinic tenancy. Logs activity to sync_log.

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

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerAuthUser }, error: authError } = await callerClient.auth.getUser();

    if (authError || !callerAuthUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up caller details
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
      return new Response(JSON.stringify({ error: 'Only clinic administrators can export data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    let type = url.searchParams.get('type');

    if (!type && req.method === 'POST') {
      try {
        const body = await req.json();
        type = body.type;
      } catch {
        // use query param
      }
    }

    const exportType = type || 'patients';
    const clinicId = callerUser.clinic_id;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // 1. Export Patients CSV
    if (exportType === 'patients') {
      const { data: patients, error: pError } = await adminClient
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      const headers = ['id', 'external_id', 'full_name', 'age', 'sex', 'village', 'phone', 'allergies', 'chronic_conditions', 'created_at'];
      const csvRows = [headers.join(',')];

      for (const p of (patients ?? [])) {
        const row = [
          p.id,
          `"${(p.external_id ?? '').replace(/"/g, '""')}"`,
          `"${(p.full_name ?? '').replace(/"/g, '""')}"`,
          p.age ?? '',
          p.sex ?? '',
          `"${(p.village ?? '').replace(/"/g, '""')}"`,
          `"${(p.phone ?? '').replace(/"/g, '""')}"`,
          `"${(p.allergies ?? '').replace(/"/g, '""')}"`,
          `"${(p.chronic_conditions ?? '').replace(/"/g, '""')}"`,
          p.created_at,
        ];
        csvRows.push(row.join(','));
      }

      await adminClient.from('sync_log').insert({
        clinic_id: clinicId,
        user_id: callerAuthUser.id,
        table_name: 'patients',
        record_id: clinicId,
        operation: 'select',
        status: 'ok',
        error_message: null,
      });

      return new Response(csvRows.join('\n'), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kaya-patients-${dateStr}.csv"`,
        },
      });
    }

    // 2. Export Visits CSV
    if (exportType === 'visits') {
      const { data: visits, error: vError } = await adminClient
        .from('visits')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null)
        .order('visit_date', { ascending: false });

      if (vError) throw vError;

      const headers = ['id', 'patient_id', 'visit_type', 'visit_date', 'chief_complaint', 'diagnosis', 'icd_code', 'created_at'];
      const csvRows = [headers.join(',')];

      for (const v of (visits ?? [])) {
        const row = [
          v.id,
          v.patient_id,
          v.visit_type,
          v.visit_date,
          `"${(v.chief_complaint ?? '').replace(/"/g, '""')}"`,
          `"${(v.diagnosis ?? '').replace(/"/g, '""')}"`,
          v.icd_code ?? '',
          v.created_at,
        ];
        csvRows.push(row.join(','));
      }

      await adminClient.from('sync_log').insert({
        clinic_id: clinicId,
        user_id: callerAuthUser.id,
        table_name: 'visits',
        record_id: clinicId,
        operation: 'select',
        status: 'ok',
        error_message: null,
      });

      return new Response(csvRows.join('\n'), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kaya-visits-${dateStr}.csv"`,
        },
      });
    }

    // 3. Full Backup Export (Archive representation with all clinic relational tables)
    if (exportType === 'full') {
      const [patientsRes, visitsRes, prescriptionsRes, attachmentsRes] = await Promise.all([
        adminClient.from('patients').select('*').eq('clinic_id', clinicId).is('deleted_at', null),
        adminClient.from('visits').select('*').eq('clinic_id', clinicId).is('deleted_at', null),
        adminClient.from('prescriptions').select('*').eq('clinic_id', clinicId).is('deleted_at', null),
        adminClient.from('attachments').select('*').eq('clinic_id', clinicId).is('deleted_at', null),
      ]);

      const backupData = {
        clinic_id: clinicId,
        exported_at: new Date().toISOString(),
        exported_by: callerUser.full_name,
        patients: patientsRes.data ?? [],
        visits: visitsRes.data ?? [],
        prescriptions: prescriptionsRes.data ?? [],
        attachments: attachmentsRes.data ?? [],
      };

      await adminClient.from('sync_log').insert({
        clinic_id: clinicId,
        user_id: callerAuthUser.id,
        table_name: 'clinics',
        record_id: clinicId,
        operation: 'select',
        status: 'ok',
        error_message: null,
      });

      return new Response(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="kaya-backup-${dateStr}.json"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: `Unsupported export type: ${exportType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
