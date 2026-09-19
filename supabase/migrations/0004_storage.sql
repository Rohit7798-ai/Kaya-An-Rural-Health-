-- ============================================================================
-- Migration: 0004_storage.sql
-- Description: Private attachments bucket and clinic-isolated storage policies
-- Path format: {clinic_id}/{patient_id}/{attachment_id}/{filename}
-- ============================================================================

-- 1. Create private attachments bucket (if not exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  52428800, -- 50MB max per document
  null      -- accept images, PDFs, scans
)
on conflict (id) do update
set public = false;

-- 2. Storage Policies on storage.objects

-- Select policy: User can only read objects in their clinic's folder prefix
drop policy if exists "storage_attachments_select" on storage.objects;
create policy "storage_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1]::uuid = public.current_clinic_id()
);

-- Insert policy: Admins, clinicians, and health workers can upload attachments
drop policy if exists "storage_attachments_insert" on storage.objects;
create policy "storage_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1]::uuid = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician', 'health_worker')
);

-- Delete policy: Only admins and clinicians can delete stored files
drop policy if exists "storage_attachments_delete" on storage.objects;
create policy "storage_attachments_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'attachments'
  and auth.uid() is not null
  and (storage.foldername(name))[1]::uuid = public.current_clinic_id()
  and public.current_role() in ('admin', 'clinician')
);
