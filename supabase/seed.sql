-- ============================================================================
-- Supabase Seed Data — Kaya EMR
-- Populates demo clinic, 4 staff roles, 6 patients, 7 historical visits,
-- prescriptions, an attachment with high-confidence OCR, and sync log events.
-- ============================================================================

-- 1. Demo Clinic
insert into public.clinics (
  id,
  name,
  facility_code,
  district,
  state,
  time_zone,
  default_language,
  created_at,
  updated_at
) values (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Kaya Rural Clinic',
  'MH-WRD-0142',
  'Wardha',
  'Maharashtra',
  'Asia/Kolkata',
  'en',
  now() - interval '3 years',
  now()
) on conflict (id) do update set name = excluded.name;

-- 2. Auth Users & Public Users
-- Insert into auth.users (standard Supabase schema)
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) values
  ('u0000000-0000-0000-0000-000000000001'::uuid, 'authenticated', 'authenticated', 'a.kulkarni@kaya.health', crypt('kaya1234', gen_salt('bf')), now() - interval '2 years', now() - interval '2 years', now()),
  ('u0000000-0000-0000-0000-000000000002'::uuid, 'authenticated', 'authenticated', 's.meshram@kaya.health', crypt('kaya1234', gen_salt('bf')), now() - interval '2 years', now() - interval '2 years', now()),
  ('u0000000-0000-0000-0000-000000000003'::uuid, 'authenticated', 'authenticated', 'r.yadav@kaya.health', crypt('kaya1234', gen_salt('bf')), now() - interval '1 year', now() - interval '1 year', now()),
  ('u0000000-0000-0000-0000-000000000004'::uuid, 'authenticated', 'authenticated', 'p.deshmukh@kaya.health', crypt('kaya1234', gen_salt('bf')), now() - interval '1 month', now() - interval '1 month', now())
on conflict (id) do nothing;

-- Mirror in public.users
insert into public.users (
  id,
  clinic_id,
  full_name,
  role,
  pin_hash,
  last_active_at,
  created_at,
  updated_at
) values
  ('u0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Dr. A. Kulkarni', 'admin', crypt('4421', gen_salt('bf')), now() - interval '2 minutes', now() - interval '2 years', now()),
  ('u0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Nurse S. Meshram', 'clinician', crypt('1092', gen_salt('bf')), now() - interval '12 minutes', now() - interval '2 years', now()),
  ('u0000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'R. Yadav', 'health_worker', crypt('8832', gen_salt('bf')), now() - interval '1 hour', now() - interval '1 year', now()),
  ('u0000000-0000-0000-0000-000000000004'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'P. Deshmukh', 'viewer', null, null, now() - interval '1 month', now())
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

-- 3. Six Seeded Patients
insert into public.patients (
  id,
  clinic_id,
  external_id,
  full_name,
  age,
  sex,
  village,
  phone,
  emergency_contact,
  allergies,
  chronic_conditions,
  free_notes,
  alerts,
  created_by,
  created_at,
  updated_at
) values
  (
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0412',
    'Sunita Patil',
    42,
    'female',
    'Wardha',
    '+91 98421 00412',
    'Ramesh Patil (Husband) +91 98421 00413',
    'Penicillin allergy (hives and facial edema)',
    'Type 2 Diabetes Mellitus, Essential Hypertension',
    'Patient resides near old bus stand. Regular attendee at Sub-Centre outreach camps.',
    '[{"id":"a1","type":"danger","label":"Penicillin allergy"},{"id":"a2","type":"warning","label":"Diabetic"}]'::jsonb,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2023-03-14 09:30:00+05:30',
    now()
  ),
  (
    'p0000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0413',
    'Ramesh Yadav',
    34,
    'male',
    'Hinganghat',
    '+91 94331 87219',
    'Sunita Yadav (Wife) +91 94331 87220',
    'None reported',
    'None',
    'Farmer, pesticide safety counseling completed in 2025.',
    '[]'::jsonb,
    'u0000000-0000-0000-0000-000000000003'::uuid,
    '2024-06-10 11:00:00+05:30',
    now()
  ),
  (
    'p0000000-0000-0000-0000-000000000003'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0414',
    'Anjali Meshram',
    23,
    'female',
    'Seloo',
    '+91 97320 11984',
    'Ganesh Meshram (Father-in-law)',
    'None reported',
    'Primigravida (28 weeks gestation)',
    'MCP card issued. High compliance with IFA supplements.',
    '[{"id":"a3","type":"info","label":"Antenatal Care"}]'::jsonb,
    'u0000000-0000-0000-0000-000000000002'::uuid,
    '2025-01-18 10:15:00+05:30',
    now()
  ),
  (
    'p0000000-0000-0000-0000-000000000004'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0415',
    'Gopal Chandra Das',
    62,
    'male',
    'Deoli',
    '+91 98302 99411',
    'Rabin Das (Son) +91 98302 99412',
    'Sulfa drugs',
    'Type 2 Diabetes Mellitus, Bilateral Osteoarthritis knees',
    'Difficulty walking steep grades. Home visit recommended quarterly.',
    '[{"id":"a4","type":"danger","label":"Sulfa allergy"}]'::jsonb,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2023-08-22 14:00:00+05:30',
    now()
  ),
  (
    'p0000000-0000-0000-0000-000000000005'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0416',
    'Pooja Waghmare',
    28,
    'female',
    'Wardha',
    '+91 98721 00219',
    'Shanti Waghmare (Mother)',
    'None reported',
    'None',
    'Recent postpartum review. Infant immunizations on schedule.',
    '[]'::jsonb,
    'u0000000-0000-0000-0000-000000000002'::uuid,
    '2025-09-02 09:45:00+05:30',
    now()
  ),
  (
    'p0000000-0000-0000-0000-000000000006'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'P-0417',
    'Bikram Mondal',
    45,
    'male',
    'Arvi',
    '+91 98311 44520',
    'Kalyani Mondal (Wife)',
    'NSAIDs (gastric burning)',
    'Essential Hypertension',
    'Occasional smoker, counseling ongoing.',
    '[]'::jsonb,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2024-02-14 16:20:00+05:30',
    now()
  )
on conflict (id) do nothing;

-- 4. Seven Historical Visits for Sunita Patil (2023–2026)
insert into public.visits (
  id,
  clinic_id,
  patient_id,
  visit_type,
  visit_date,
  seen_by,
  chief_complaint,
  duration_value,
  duration_unit,
  notes,
  vitals,
  diagnosis,
  icd_code,
  follow_up_date,
  created_by,
  created_at,
  updated_at
) values
  -- Visit 1 (March 2023): Initial Diagnosis
  (
    'v0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'consult',
    '2023-03-14 10:00:00+05:30',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'Recurrent occipital headaches, fatigue, increased thirst for 3 weeks',
    3,
    'weeks',
    'Initial clinical workup. Elevated resting blood pressure confirmed across multiple readings. Fasting blood sugar elevated at 156 mg/dL. Initiated lifestyle modification and oral pharmacotherapy.',
    '{"bp": "158/98", "pulse": 82, "temp": 36.8, "weight": 64}'::jsonb,
    'Essential Hypertension (Stage 2) and newly detected Type 2 Diabetes Mellitus',
    'I10, E11.9',
    '2023-09-18',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2023-03-14 10:30:00+05:30',
    '2023-03-14 10:30:00+05:30'
  ),
  -- Visit 2 (September 2023): 6-Month Review
  (
    'v0000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'follow_up',
    '2023-09-18 11:15:00+05:30',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'Follow-up visit for blood pressure and glucose check. Occasional afternoon tiredness.',
    2,
    'months',
    'Patient compliant with morning dosage. Headaches significantly decreased. Diet counseling re-emphasized.',
    '{"bp": "142/88", "pulse": 76, "temp": 36.6, "weight": 63.5}'::jsonb,
    'Essential Hypertension (improving)',
    'I10',
    '2024-03-11',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2023-09-18 11:45:00+05:30',
    '2023-09-18 11:45:00+05:30'
  ),
  -- Visit 3 (March 2024): Biochemical Evaluation
  (
    'v0000000-0000-0000-0000-000000000003'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'lab',
    '2024-03-11 09:40:00+05:30',
    'u0000000-0000-0000-0000-000000000002'::uuid,
    'Routine biochemical laboratory panel review (FPG, HbA1c, Renal function)',
    null,
    null,
    'HbA1c 7.1%. Serum creatinine within normal limits. Advised continuation of Metformin SR 500mg.',
    '{"bp": "136/84", "pulse": 80, "temp": 36.7, "weight": 63}'::jsonb,
    'Type 2 Diabetes Mellitus under fair control',
    'E11.9',
    '2024-10-05',
    'u0000000-0000-0000-0000-000000000002'::uuid,
    '2024-03-11 10:00:00+05:30',
    '2024-03-11 10:00:00+05:30'
  ),
  -- Visit 4 (October 2024): Acute Episode
  (
    'v0000000-0000-0000-0000-000000000004'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'emergency',
    '2024-10-05 14:10:00+05:30',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'Fever with chills and body ache for 2 days. Nausea without vomiting.',
    2,
    'days',
    'RDT negative for Malaria. Widal test non-reactive. Diagnosed as acute viral syndrome. Paracetamol 500mg prescribed. Antihypertensives continued.',
    '{"bp": "130/82", "pulse": 94, "temp": 38.6, "weight": 62}'::jsonb,
    'Acute Febrile Illness (Viral syndrome)',
    'A99',
    '2024-10-12',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2024-10-05 14:35:00+05:30',
    '2024-10-05 14:35:00+05:30'
  ),
  -- Visit 5 (April 2025): Annual Check
  (
    'v0000000-0000-0000-0000-000000000005'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'consult',
    '2025-04-20 10:30:00+05:30',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'Annual diabetic evaluation and foot monofilament examination',
    1,
    'months',
    'Peripheral pulses intact bilaterally. No diabetic ulcers or calluses. Sensations intact with 10g monofilament.',
    '{"bp": "132/84", "pulse": 78, "temp": 36.6, "weight": 62}'::jsonb,
    'Type 2 Diabetes Mellitus without microvascular complications',
    'E11.9',
    '2025-11-14',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2025-04-20 11:00:00+05:30',
    '2025-04-20 11:00:00+05:30'
  ),
  -- Visit 6 (November 2025): Prescription Renewal
  (
    'v0000000-0000-0000-0000-000000000006'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'rx',
    '2025-11-14 11:00:00+05:30',
    'u0000000-0000-0000-0000-000000000002'::uuid,
    'Quarterly refill of ongoing antihypertensive and hypoglycemic medications',
    null,
    null,
    'Vitals within acceptable limits. Refilled Telmisartan and Metformin for 90 days.',
    '{"bp": "130/80", "pulse": 75, "temp": 36.7, "weight": 61.5}'::jsonb,
    'Controlled Essential Hypertension',
    'I10',
    '2026-05-12',
    'u0000000-0000-0000-0000-000000000002'::uuid,
    '2025-11-14 11:20:00+05:30',
    '2025-11-14 11:20:00+05:30'
  ),
  -- Visit 7 (September 2026): Latest Consultation
  (
    'v0000000-0000-0000-0000-000000000007'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'consult',
    '2026-09-14 10:24:00+05:30',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'Follow-up for hypertension, morning head heaviness and mild neck tightness',
    4,
    'days',
    'Patient reports consistent compliance with antihypertensives over the past 3 months. Morning headaches have reduced. Fasting glucose reviewed. Lipid panel completed in side lab.',
    '{"bp": "128/82", "pulse": 78, "temp": 36.8, "weight": 61}'::jsonb,
    'Stage 1 Essential Hypertension (controlled on medication)',
    'I10',
    '2026-12-14',
    'u0000000-0000-0000-0000-000000000001'::uuid,
    '2026-09-14 10:45:00+05:30',
    now()
  )
on conflict (id) do nothing;

-- 5. Two Prescriptions on Latest Visit (Visit 7)
insert into public.prescriptions (
  id,
  clinic_id,
  visit_id,
  medicine,
  dose,
  frequency,
  duration_value,
  duration_unit,
  position,
  created_at,
  updated_at
) values
  (
    'rx000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'v0000000-0000-0000-0000-000000000007'::uuid,
    'Telmisartan Tablets',
    '40 mg',
    'OD',
    30,
    'days',
    1,
    '2026-09-14 10:35:00+05:30',
    now()
  ),
  (
    'rx000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'v0000000-0000-0000-0000-000000000007'::uuid,
    'Metformin Hydrochloride SR Tablets',
    '500 mg',
    'BD',
    30,
    'days',
    2,
    '2026-09-14 10:36:00+05:30',
    now()
  )
on conflict (id) do nothing;

-- 6. One Attachment with Realistic OCR Text & High Confidence (0.940)
insert into public.attachments (
  id,
  clinic_id,
  patient_id,
  visit_id,
  kind,
  filename,
  mime_type,
  size_bytes,
  storage_path,
  ocr_text,
  ocr_confidence,
  ocr_status,
  uploaded_by,
  created_at,
  updated_at
) values (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'p0000000-0000-0000-0000-000000000001'::uuid,
  'v0000000-0000-0000-0000-000000000007'::uuid,
  'lab',
  'lab_lipid_profile_mar2026.pdf',
  'application/pdf',
  1258291,
  'c0000000-0000-0000-0000-000000000001/p0000000-0000-0000-0000-000000000001/a0000000-0000-0000-0000-000000000001/lab_lipid_profile_mar2026.pdf',
  'SHANTI RURAL HEALTH LABORATORY — BIOCHEMISTRY INVESTIGATION
Facility: MH-WRD-0142 · Date: 14-Sep-2026
Patient: Sunita Patil · 42F · ID: P-0412 · Ref: Dr. A. Kulkarni
Specimen: Fasting Venous Whole Blood · Automated Photometry
------------------------------------------------------------
TEST DESCRIPTION             RESULT       REFERENCE RANGE
Fasting Plasma Glucose (FPG) 114 mg/dL    [70 - 99 Normal, 100-125 Impaired]
Post-Prandial Blood Sugar    148 mg/dL    [< 140 Normal, 140-199 Impaired]
Glycated Hemoglobin (HbA1c)  6.8 %        [< 5.7 Normal, 5.7-6.4 Prediabetes]
Serum Creatinine             0.92 mg/dL   [0.60 - 1.20 mg/dL]
Blood Urea Nitrogen (BUN)    16 mg/dL     [7 - 20 mg/dL]
Total Cholesterol            184 mg/dL    [< 200 Desirable]
Serum Triglycerides          142 mg/dL    [< 150 Normal]
HDL Cholesterol (Good)       46 mg/dL     [> 50 Target]
LDL Cholesterol (Calculated) 110 mg/dL    [< 100 Optimal]
------------------------------------------------------------
Impression: Glycemic markers indicate stable metabolic control on current regimen.
Renal functional parameters within normal adult physiological limits.',
  0.940,
  'ready',
  'u0000000-0000-0000-0000-000000000001'::uuid,
  '2026-09-14 10:40:00+05:30',
  now()
) on conflict (id) do nothing;

-- 7. Three Sync Log Audit Entries
insert into public.sync_log (
  id,
  clinic_id,
  user_id,
  table_name,
  record_id,
  operation,
  status,
  error_message,
  created_at
) values
  (
    's0000000-0000-0000-0000-000000000001'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'patients',
    'p0000000-0000-0000-0000-000000000001'::uuid,
    'insert',
    'ok',
    null,
    '2023-03-14 09:30:05+05:30'
  ),
  (
    's0000000-0000-0000-0000-000000000002'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'visits',
    'v0000000-0000-0000-0000-000000000007'::uuid,
    'insert',
    'ok',
    null,
    '2026-09-14 10:45:02+05:30'
  ),
  (
    's0000000-0000-0000-0000-000000000003'::uuid,
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'u0000000-0000-0000-0000-000000000001'::uuid,
    'attachments',
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'update',
    'ok',
    null,
    '2026-09-14 10:48:15+05:30'
  )
on conflict (id) do nothing;
