-- ============================================================================
-- Migration: 0001_schema.sql
-- Description: Core schema for Kaya EMR (Offline-first rural clinic)
-- Postgres 15 compatible, UUID primary keys, timestamptz throughout.
-- ============================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 2. Clinics table
-- Stores primary rural health centres / clinic nodes.
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  facility_code text unique not null,
  district text,
  state text,
  time_zone text not null default 'Asia/Kolkata',
  default_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. Users table
-- Mirror of auth.users keyed by the same id, scoped to a clinic with RBAC roles.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'clinician', 'health_worker', 'viewer')),
  pin_hash text,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_users_clinic_role on public.users (clinic_id, role);

-- 4. Patients table
-- Patient demographic, chronic alert, and village registry records.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  external_id text,
  full_name text not null,
  age int check (age between 0 and 120),
  sex text check (sex in ('female', 'male', 'other')),
  village text,
  phone text,
  emergency_contact text,
  address text,
  allergies text,
  chronic_conditions text,
  free_notes text,
  alerts jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_patients_clinic_name_lower on public.patients (clinic_id, lower(full_name));
create index if not exists idx_patients_clinic_village on public.patients (clinic_id, village);
create index if not exists idx_patients_clinic_external_id on public.patients (clinic_id, external_id);
create index if not exists idx_patients_fts on public.patients using gin (
  to_tsvector('simple', full_name || ' ' || coalesce(village, ''))
);

-- 5. Visits table
-- Clinical encounters, chief complaints, objective vitals, diagnoses, and notes.
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  visit_type text not null check (visit_type in ('consult', 'follow_up', 'emergency', 'lab', 'rx')),
  visit_date timestamptz not null default now(),
  seen_by uuid references public.users(id) on delete set null,
  chief_complaint text,
  duration_value int,
  duration_unit text check (duration_unit in ('days', 'weeks', 'months')),
  notes text,
  vitals jsonb,
  diagnosis text,
  icd_code text,
  follow_up_date date,
  follow_up_note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_visits_clinic_patient_date on public.visits (clinic_id, patient_id, visit_date desc);
create index if not exists idx_visits_clinic_date on public.visits (clinic_id, visit_date desc);

-- 6. Prescriptions table
-- Ordered medications and dosing instructions associated with a consultation.
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  visit_id uuid not null references public.visits(id) on delete cascade,
  medicine text not null,
  dose text,
  frequency text check (frequency in ('OD', 'BD', 'TDS', 'QID', 'PRN', 'other')),
  duration_value int,
  duration_unit text check (duration_unit in ('days', 'weeks', 'months')),
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_prescriptions_visit_pos on public.prescriptions (visit_id, position);

-- 7. Attachments table
-- Metadata, storage bucket pointers, and OCR extractions for diagnostic documents.
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  kind text not null check (kind in ('lab', 'rx', 'scan', 'photo', 'other')),
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  ocr_text text,
  ocr_confidence numeric(4,3),
  ocr_status text not null default 'pending' check (
    ocr_status in ('pending', 'processing', 'ready', 'failed', 'confirmed')
  ),
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_attachments_clinic_visit on public.attachments (clinic_id, visit_id);
create index if not exists idx_attachments_clinic_patient on public.attachments (clinic_id, patient_id);
create index if not exists idx_attachments_clinic_ocr_status on public.attachments (clinic_id, ocr_status);

-- 8. Sync Log table
-- Append-only audit trail of peer-to-peer and cloud sync mutations.
create table if not exists public.sync_log (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  operation text not null check (operation in ('insert', 'update', 'delete')),
  status text not null check (status in ('ok', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sync_log_clinic_created on public.sync_log (clinic_id, created_at desc);
