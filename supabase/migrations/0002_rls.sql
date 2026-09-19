-- ============================================================================
-- Migration: 0002_rls.sql
-- Description: Row Level Security (RLS) policies and security helper functions
-- Scopes data strictly to the caller's clinic and enforces role-based access.
-- ============================================================================

-- 1. Helper Functions
create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.users where id = auth.uid() and deleted_at is null;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and deleted_at is null;
$$;

-- Grant execution to authenticated users
grant execute on function public.current_clinic_id to authenticated;
grant execute on function public.current_role to authenticated;

-- 2. Enable RLS on all tables
alter table public.clinics enable row level security;
alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.prescriptions enable row level security;
alter table public.attachments enable row level security;
alter table public.sync_log enable row level security;

-- ----------------------------------------------------------------------------
-- CLINICS Policies
-- ----------------------------------------------------------------------------
-- Select: Any authenticated user can view their own clinic
create policy "clinics_select"
on public.clinics
for select
to authenticated
using (
  id = public.current_clinic_id()
);

-- Update: Only admins can update their clinic settings
create policy "clinics_update"
on public.clinics
for update
to authenticated
using (
  id = public.current_clinic_id()
  and public.current_role() = 'admin'
)
with check (
  id = public.current_clinic_id()
  and public.current_role() = 'admin'
);

-- Insert & Delete: Denied (managed at infrastructure/tenant provisioning level)

-- ----------------------------------------------------------------------------
-- USERS Policies
-- ----------------------------------------------------------------------------
-- Select: Users in the same clinic can view staff directory
create policy "users_select"
on public.users
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

-- Update: Users can update their own profile; admins can update staff roles in their clinic
create policy "users_update"
on public.users
for update
to authenticated
using (
  (id = auth.uid()) or
  (clinic_id = public.current_clinic_id() and public.current_role() = 'admin')
)
with check (
  (id = auth.uid()) or
  (clinic_id = public.current_clinic_id() and public.current_role() = 'admin')
);

-- Delete: Admins can remove users in their clinic, but cannot remove themselves
create policy "users_delete"
on public.users
for delete
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() = 'admin'
  and id <> auth.uid()
);

-- Insert: Denied (invitations are handled securely via Edge Function with service role)

-- ----------------------------------------------------------------------------
-- PATIENTS Policies
-- ----------------------------------------------------------------------------
-- Select: Any member of the clinic can view patient records
create policy "patients_select"
on public.patients
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

-- Insert: Admins, clinicians, and health workers can register patients
create policy "patients_insert"
on public.patients
for insert
to authenticated
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

-- Update: Admins, clinicians, and health workers can update patient details
create policy "patients_update"
on public.patients
for update
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
)
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

-- Delete: Only admins and clinicians can delete/tombstone patient records
create policy "patients_delete"
on public.patients
for delete
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician')
);

-- ----------------------------------------------------------------------------
-- VISITS Policies
-- ----------------------------------------------------------------------------
create policy "visits_select"
on public.visits
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

create policy "visits_insert"
on public.visits
for insert
to authenticated
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

create policy "visits_update"
on public.visits
for update
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
)
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

create policy "visits_delete"
on public.visits
for delete
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician')
);

-- ----------------------------------------------------------------------------
-- PRESCRIPTIONS Policies
-- ----------------------------------------------------------------------------
create policy "prescriptions_select"
on public.prescriptions
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

create policy "prescriptions_insert"
on public.prescriptions
for insert
to authenticated
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
  and exists (
    select 1 from public.visits v
    where v.id = visit_id and v.clinic_id = public.current_clinic_id()
  )
);

create policy "prescriptions_update"
on public.prescriptions
for update
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
  and exists (
    select 1 from public.visits v
    where v.id = visit_id and v.clinic_id = public.current_clinic_id()
  )
)
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
  and exists (
    select 1 from public.visits v
    where v.id = visit_id and v.clinic_id = public.current_clinic_id()
  )
);

create policy "prescriptions_delete"
on public.prescriptions
for delete
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician')
);

-- ----------------------------------------------------------------------------
-- ATTACHMENTS Policies
-- ----------------------------------------------------------------------------
create policy "attachments_select"
on public.attachments
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

create policy "attachments_insert"
on public.attachments
for insert
to authenticated
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

create policy "attachments_update"
on public.attachments
for update
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
)
with check (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

create policy "attachments_delete"
on public.attachments
for delete
to authenticated
using (
  clinic_id = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician')
);

-- ----------------------------------------------------------------------------
-- SYNC LOG Policies
-- ----------------------------------------------------------------------------
-- Select: Any authenticated user can read audit sync logs for their clinic
create policy "sync_log_select"
on public.sync_log
for select
to authenticated
using (
  clinic_id = public.current_clinic_id()
);

-- Insert, Update, Delete: Denied for general clients. Written only via Service Role.
