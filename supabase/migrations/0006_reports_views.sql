-- ============================================================================
-- Migration: 0006_reports_views.sql
-- Description: Aggregate reporting functions for Kaya EMR
-- Scoped to current_clinic_id() with SECURITY INVOKER
-- ============================================================================

-- 1. report_headline(range_days int) returns jsonb
--    -> { seen, new_registrations, follow_ups, pending_sync }
create or replace function public.report_headline(range_days int default 30)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  cid uuid := public.current_clinic_id();
  start_cutoff timestamptz := now() - (coalesce(range_days, 30) || ' days')::interval;
  seen_count int;
  new_reg_count int;
  follow_up_count int;
  pending_sync_count int;
begin
  -- Total patients seen in period
  select count(distinct patient_id)
  into seen_count
  from public.visits
  where clinic_id = cid
    and deleted_at is null
    and created_at >= start_cutoff;

  -- New patient registrations in period
  select count(*)
  into new_reg_count
  from public.patients
  where clinic_id = cid
    and deleted_at is null
    and created_at >= start_cutoff;

  -- Follow-ups in period (visits where visit_type = 'Follow-up' or patient has >1 visit)
  select count(*)
  into follow_up_count
  from public.visits
  where clinic_id = cid
    and deleted_at is null
    and created_at >= start_cutoff
    and (visit_type = 'Follow-up' or visit_type ilike '%follow%');

  -- Pending sync queue items
  select count(*)
  into pending_sync_count
  from public.sync_queue
  where clinic_id = cid
    and status in ('pending', 'failed');

  return jsonb_build_object(
    'seen', coalesce(seen_count, 0),
    'new_registrations', coalesce(new_reg_count, 0),
    'follow_ups', coalesce(follow_up_count, 0),
    'pending_sync', coalesce(pending_sync_count, 0)
  );
end;
$$;

-- 2. report_top_diagnoses(range_days int) returns table(diagnosis text, count int)
create or replace function public.report_top_diagnoses(range_days int default 30)
returns table(diagnosis text, count int)
language sql
security invoker
set search_path = public
as $$
  select
    coalesce(nullif(trim(v.diagnosis), ''), 'General consultation') as diagnosis,
    count(*)::int as count
  from public.visits v
  where v.clinic_id = public.current_clinic_id()
    and v.deleted_at is null
    and v.created_at >= (now() - (coalesce(range_days, 30) || ' days')::interval)
    and v.diagnosis is not null
  group by 1
  order by count desc, diagnosis asc
  limit 10;
$$;

-- 3. report_villages(range_days int) returns table(village text, count int)
create or replace function public.report_villages(range_days int default 30)
returns table(village text, count int)
language sql
security invoker
set search_path = public
as $$
  select
    coalesce(nullif(trim(p.village), ''), 'Unknown') as village,
    count(*)::int as count
  from public.patients p
  where p.clinic_id = public.current_clinic_id()
    and p.deleted_at is null
    and p.created_at >= (now() - (coalesce(range_days, 30) || ' days')::interval)
  group by 1
  order by count desc, village asc
  limit 10;
$$;

-- 4. report_sync_health(range_days int) returns jsonb
create or replace function public.report_sync_health(range_days int default 30)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  cid uuid := public.current_clinic_id();
  start_cutoff timestamptz := now() - (coalesce(range_days, 30) || ' days')::interval;
  synced_count int;
  pending_count int;
  failed_count int;
  rate numeric;
begin
  select
    count(*) filter (where status = 'synced'),
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'failed')
  into synced_count, pending_count, failed_count
  from public.sync_queue
  where clinic_id = cid
    and created_at >= start_cutoff;

  if (coalesce(synced_count, 0) + coalesce(failed_count, 0)) > 0 then
    rate := round((synced_count::numeric / (synced_count + failed_count)::numeric) * 100, 1);
  else
    rate := 100.0;
  end if;

  return jsonb_build_object(
    'records_synced', coalesce(synced_count, 0),
    'pending_count', coalesce(pending_count, 0),
    'failed_count', coalesce(failed_count, 0),
    'success_rate_percent', rate,
    'last_successful_sync', now()
  );
end;
$$;

-- Grant execute permissions
grant execute on function public.report_headline to authenticated;
grant execute on function public.report_top_diagnoses to authenticated;
grant execute on function public.report_villages to authenticated;
grant execute on function public.report_sync_health to authenticated;
