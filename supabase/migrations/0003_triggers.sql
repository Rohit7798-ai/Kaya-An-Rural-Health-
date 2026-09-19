-- ============================================================================
-- Migration: 0003_triggers.sql
-- Description: Updated_at maintenance triggers across all mutable tables
-- ============================================================================

-- Function to automatically bump updated_at on record mutation
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Clinics trigger
drop trigger if exists trg_clinics_updated_at on public.clinics;
create trigger trg_clinics_updated_at
  before update on public.clinics
  for each row
  execute function public.set_updated_at();

-- 2. Users trigger
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- 3. Patients trigger
drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
  before update on public.patients
  for each row
  execute function public.set_updated_at();

-- 4. Visits trigger
drop trigger if exists trg_visits_updated_at on public.visits;
create trigger trg_visits_updated_at
  before update on public.visits
  for each row
  execute function public.set_updated_at();

-- 5. Prescriptions trigger
drop trigger if exists trg_prescriptions_updated_at on public.prescriptions;
create trigger trg_prescriptions_updated_at
  before update on public.prescriptions
  for each row
  execute function public.set_updated_at();

-- 6. Attachments trigger
drop trigger if exists trg_attachments_updated_at on public.attachments;
create trigger trg_attachments_updated_at
  before update on public.attachments
  for each row
  execute function public.set_updated_at();
