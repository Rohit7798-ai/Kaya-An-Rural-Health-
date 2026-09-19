-- ============================================================================
-- Migration: 0006_offline_sync.sql
-- Description: Direct Offline Sync RPCs (Pull & Push) without PowerSync.
-- Optimized for high-latency rural mobile connections (2G/3G), atomic transactions,
-- clinic multi-tenancy enforcement, and automatic sync audit logging.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PULL CLINIC CHANGES
-- Returns all records in the user's clinic modified since last_pulled_at.
-- If last_pulled_at is null, returns initial full dataset for the clinic.
-- ----------------------------------------------------------------------------
create or replace function public.pull_clinic_changes(last_pulled_at timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  current_server_time timestamptz := now();
  result jsonb;
begin
  cid := public.current_clinic_id();
  if cid is null then
    raise exception 'Unauthorized: No clinic association found for current user';
  end if;

  select jsonb_build_object(
    'server_time', current_server_time,
    'clinic_id', cid,
    'clinics', coalesce((
      select jsonb_agg(c) from public.clinics c
      where c.id = cid
        and (last_pulled_at is null or c.updated_at > last_pulled_at)
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(u) from public.users u
      where u.clinic_id = cid
        and (last_pulled_at is null or u.updated_at > last_pulled_at)
    ), '[]'::jsonb),
    'patients', coalesce((
      select jsonb_agg(p) from public.patients p
      where p.clinic_id = cid
        and (last_pulled_at is null or p.updated_at > last_pulled_at)
    ), '[]'::jsonb),
    'visits', coalesce((
      select jsonb_agg(v) from public.visits v
      where v.clinic_id = cid
        and (last_pulled_at is null or v.updated_at > last_pulled_at)
    ), '[]'::jsonb),
    'prescriptions', coalesce((
      select jsonb_agg(rx) from public.prescriptions rx
      where rx.clinic_id = cid
        and (last_pulled_at is null or rx.updated_at > last_pulled_at)
    ), '[]'::jsonb),
    'attachments', coalesce((
      select jsonb_agg(a) from public.attachments a
      where a.clinic_id = cid
        and (last_pulled_at is null or a.updated_at > last_pulled_at)
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

grant execute on function public.pull_clinic_changes(timestamptz) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. PUSH CLINIC CHANGES
-- Applies an array of client-queued offline mutations inside a single transaction.
-- Each mutation object format:
-- {
--   "table": "patients"|"visits"|"prescriptions"|"attachments",
--   "operation": "insert"|"update"|"delete",
--   "record_id": "<uuid>",
--   "data": { ... fields ... }
-- }
-- ----------------------------------------------------------------------------
create or replace function public.push_clinic_changes(mutations jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  uid uuid := auth.uid();
  u_role text;
  m jsonb;
  tbl text;
  op text;
  rec_id uuid;
  rec_data jsonb;
  processed_count int := 0;
  server_now timestamptz := now();
begin
  cid := public.current_clinic_id();
  u_role := public.current_role();

  if cid is null or uid is null then
    raise exception 'Unauthorized: Invalid authentication credentials';
  end if;

  if u_role = 'viewer' then
    raise exception 'Forbidden: Viewers have read-only permissions and cannot push mutations';
  end if;

  -- Process each mutation in order
  for m in select * from jsonb_array_elements(mutations)
  loop
    tbl := m->>'table';
    op := m->>'operation';
    rec_id := (m->>'record_id')::uuid;
    rec_data := m->'data';

    if tbl = 'patients' then
      if op in ('insert', 'update') then
        insert into public.patients (
          id, clinic_id, external_id, full_name, age, sex, village, phone,
          emergency_contact, address, allergies, chronic_conditions, free_notes,
          alerts, created_by, created_at, updated_at, deleted_at
        ) values (
          rec_id,
          cid,
          rec_data->>'external_id',
          coalesce(rec_data->>'full_name', 'Unnamed Patient'),
          (rec_data->>'age')::int,
          rec_data->>'sex',
          rec_data->>'village',
          rec_data->>'phone',
          rec_data->>'emergency_contact',
          rec_data->>'address',
          rec_data->>'allergies',
          rec_data->>'chronic_conditions',
          rec_data->>'free_notes',
          coalesce(rec_data->'alerts', '[]'::jsonb),
          uid,
          coalesce((rec_data->>'created_at')::timestamptz, server_now),
          server_now,
          null
        )
        on conflict (id) do update set
          external_id = coalesce(excluded.external_id, patients.external_id),
          full_name = excluded.full_name,
          age = excluded.age,
          sex = excluded.sex,
          village = excluded.village,
          phone = excluded.phone,
          emergency_contact = excluded.emergency_contact,
          address = excluded.address,
          allergies = excluded.allergies,
          chronic_conditions = excluded.chronic_conditions,
          free_notes = excluded.free_notes,
          alerts = excluded.alerts,
          updated_at = server_now
        where patients.clinic_id = cid;
      elsif op = 'delete' then
        update public.patients
        set deleted_at = server_now, updated_at = server_now
        where id = rec_id and clinic_id = cid;
      end if;

    elsif tbl = 'visits' then
      if op in ('insert', 'update') then
        insert into public.visits (
          id, clinic_id, patient_id, visit_type, visit_date, seen_by,
          chief_complaint, duration_value, duration_unit, notes, vitals,
          diagnosis, icd_code, follow_up_date, follow_up_note, created_by,
          created_at, updated_at, deleted_at
        ) values (
          rec_id,
          cid,
          (rec_data->>'patient_id')::uuid,
          coalesce(rec_data->>'visit_type', 'consult'),
          coalesce((rec_data->>'visit_date')::timestamptz, server_now),
          coalesce((rec_data->>'seen_by')::uuid, uid),
          rec_data->>'chief_complaint',
          (rec_data->>'duration_value')::int,
          rec_data->>'duration_unit',
          rec_data->>'notes',
          rec_data->'vitals',
          rec_data->>'diagnosis',
          rec_data->>'icd_code',
          (rec_data->>'follow_up_date')::date,
          rec_data->>'follow_up_note',
          uid,
          coalesce((rec_data->>'created_at')::timestamptz, server_now),
          server_now,
          null
        )
        on conflict (id) do update set
          visit_type = excluded.visit_type,
          visit_date = excluded.visit_date,
          seen_by = excluded.seen_by,
          chief_complaint = excluded.chief_complaint,
          duration_value = excluded.duration_value,
          duration_unit = excluded.duration_unit,
          notes = excluded.notes,
          vitals = excluded.vitals,
          diagnosis = excluded.diagnosis,
          icd_code = excluded.icd_code,
          follow_up_date = excluded.follow_up_date,
          follow_up_note = excluded.follow_up_note,
          updated_at = server_now
        where visits.clinic_id = cid;
      elsif op = 'delete' then
        update public.visits
        set deleted_at = server_now, updated_at = server_now
        where id = rec_id and clinic_id = cid;
      end if;

    elsif tbl = 'prescriptions' then
      if op in ('insert', 'update') then
        insert into public.prescriptions (
          id, clinic_id, visit_id, medicine, dose, frequency,
          duration_value, duration_unit, position, created_at, updated_at, deleted_at
        ) values (
          rec_id,
          cid,
          (rec_data->>'visit_id')::uuid,
          coalesce(rec_data->>'medicine', 'Medication'),
          rec_data->>'dose',
          rec_data->>'frequency',
          (rec_data->>'duration_value')::int,
          rec_data->>'duration_unit',
          coalesce((rec_data->>'position')::int, 0),
          coalesce((rec_data->>'created_at')::timestamptz, server_now),
          server_now,
          null
        )
        on conflict (id) do update set
          medicine = excluded.medicine,
          dose = excluded.dose,
          frequency = excluded.frequency,
          duration_value = excluded.duration_value,
          duration_unit = excluded.duration_unit,
          position = excluded.position,
          updated_at = server_now
        where prescriptions.clinic_id = cid;
      elsif op = 'delete' then
        update public.prescriptions
        set deleted_at = server_now, updated_at = server_now
        where id = rec_id and clinic_id = cid;
      end if;

    elsif tbl = 'attachments' then
      if op in ('insert', 'update') then
        insert into public.attachments (
          id, clinic_id, patient_id, visit_id, kind, filename,
          mime_type, size_bytes, storage_path, ocr_text, ocr_confidence,
          ocr_status, uploaded_by, created_at, updated_at, deleted_at
        ) values (
          rec_id,
          cid,
          (rec_data->>'patient_id')::uuid,
          (rec_data->>'visit_id')::uuid,
          coalesce(rec_data->>'kind', 'other'),
          coalesce(rec_data->>'filename', 'document'),
          coalesce(rec_data->>'mime_type', 'application/octet-stream'),
          coalesce((rec_data->>'size_bytes')::bigint, 0),
          coalesce(rec_data->>'storage_path', ''),
          rec_data->>'ocr_text',
          (rec_data->>'ocr_confidence')::numeric,
          coalesce(rec_data->>'ocr_status', 'pending'),
          uid,
          coalesce((rec_data->>'created_at')::timestamptz, server_now),
          server_now,
          null
        )
        on conflict (id) do update set
          kind = excluded.kind,
          filename = excluded.filename,
          mime_type = excluded.mime_type,
          size_bytes = excluded.size_bytes,
          storage_path = excluded.storage_path,
          ocr_text = coalesce(excluded.ocr_text, attachments.ocr_text),
          ocr_confidence = coalesce(excluded.ocr_confidence, attachments.ocr_confidence),
          ocr_status = coalesce(excluded.ocr_status, attachments.ocr_status),
          updated_at = server_now
        where attachments.clinic_id = cid;
      elsif op = 'delete' then
        update public.attachments
        set deleted_at = server_now, updated_at = server_now
        where id = rec_id and clinic_id = cid;
      end if;
    end if;

    -- Audit trail logging
    insert into public.sync_log (
      clinic_id, user_id, table_name, record_id, operation, status, error_message, created_at
    ) values (
      cid, uid, tbl, rec_id, op, 'ok', null, server_now
    );

    processed_count := processed_count + 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'server_time', server_now
  );
end;
$$;

grant execute on function public.push_clinic_changes(jsonb) to authenticated;
