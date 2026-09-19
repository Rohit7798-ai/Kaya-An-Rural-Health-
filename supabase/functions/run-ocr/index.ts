// Supabase Edge Function: run-ocr
// Processes an attachment, extracts clinical text via OCR provider stub,
// and updates the database record. Enforces clinic tenant boundaries.

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

    // 1. Identify caller
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

    // Look up caller clinic & role
    const { data: callerUser, error: callerError } = await adminClient
      .from('users')
      .select('clinic_id, role')
      .eq('id', callerAuthUser.id)
      .is('deleted_at', null)
      .single();

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { attachment_id } = await req.json();
    if (!attachment_id) {
      return new Response(JSON.stringify({ error: 'attachment_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch attachment and verify clinic boundary
    const { data: attachment, error: attError } = await adminClient
      .from('attachments')
      .select('*')
      .eq('id', attachment_id)
      .single();

    if (attError || !attachment) {
      return new Response(JSON.stringify({ error: 'Attachment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (attachment.clinic_id !== callerUser.clinic_id) {
      return new Response(JSON.stringify({ error: 'Access denied to attachment from different clinic' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Mark status as processing
    await adminClient
      .from('attachments')
      .update({ ocr_status: 'processing' })
      .eq('id', attachment_id);

    // 4. OCR Provider Execution (Realistic clinical text extraction stub)
    const extractedText = [
      'SHANTI RURAL HEALTH LABORATORY — BIOCHEMISTRY INVESTIGATION',
      `Facility: ${callerUser.clinic_id} · Date: 14-Sep-2026`,
      'Patient: Sunita Patil · 42F · ID: P-0412 · Ref: Dr. A. Kulkarni',
      'Specimen: Fasting Venous Whole Blood · Automated Photometry',
      '------------------------------------------------------------',
      'TEST DESCRIPTION             RESULT       REFERENCE RANGE',
      'Fasting Plasma Glucose (FPG) 114 mg/dL    [70 - 99 Normal, 100-125 Impaired]',
      'Post-Prandial Blood Sugar    148 mg/dL    [< 140 Normal, 140-199 Impaired]',
      'Glycated Hemoglobin (HbA1c)  6.8 %        [< 5.7 Normal, 5.7-6.4 Prediabetes]',
      'Serum Creatinine             0.92 mg/dL   [0.60 - 1.20 mg/dL]',
      'Blood Urea Nitrogen (BUN)    16 mg/dL     [7 - 20 mg/dL]',
      'Total Cholesterol            184 mg/dL    [< 200 Desirable]',
      'Serum Triglycerides          142 mg/dL    [< 150 Normal]',
      'HDL Cholesterol (Good)       46 mg/dL     [> 50 Target]',
      'LDL Cholesterol (Calculated) 110 mg/dL    [< 100 Optimal]',
      '------------------------------------------------------------',
      'Impression: Glycemic markers indicate stable metabolic control on current regimen.',
      'Renal functional parameters within normal adult physiological limits.'
    ].join('\n');

    const confidenceScore = 0.940;

    // 5. Update record with ready state and confidence
    const { data: updatedAttachment, error: updateError } = await adminClient
      .from('attachments')
      .update({
        ocr_text: extractedText,
        ocr_confidence: confidenceScore,
        ocr_status: 'ready',
      })
      .eq('id', attachment_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 6. Log to sync_log
    await adminClient.from('sync_log').insert({
      clinic_id: callerUser.clinic_id,
      user_id: callerAuthUser.id,
      table_name: 'attachments',
      record_id: attachment_id,
      operation: 'update',
      status: 'ok',
      error_message: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        attachment: updatedAttachment,
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
