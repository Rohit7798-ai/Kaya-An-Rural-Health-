export interface OcrWord {
  id: string;
  text: string;
  confidence: number; // 0.0 - 1.0 (e.g. 0.72)
  lowConfidence: boolean;
  suggestion?: string;
  originalText: string;
}

export interface OcrLine {
  id: string;
  lineNumber: number;
  rawText: string;
  words: OcrWord[];
  confidence: number;
}

export interface AttachmentRecord {
  id: string;
  filename: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileType: 'pdf' | 'jpg' | 'png';
  uploadedAt: string;
  uploadedAtFormatted: string;
  contextType: 'visit' | 'patient';
  contextTitle: string;
  contextLink: string;
  patientName: string;
  patientClinicId: string;
  visitDate?: string;
  documentType: 'Lab Report' | 'Prescription' | 'Clinical History Card';
  overallConfidence: number;
  status: 'ready' | 'processing' | 'failed' | 'confirmed';
  confirmedBy?: string;
  confirmedAt?: string;
  lines: OcrLine[];
  rawText: string;
}

export const MOCK_ATTACHMENTS: Record<string, AttachmentRecord> = {
  'att-seed-1': {
    id: 'att-seed-1',
    filename: 'lab_lipid_profile_mar2026.pdf',
    fileSizeBytes: 1258291,
    fileSizeFormatted: '1.2 MB',
    fileType: 'pdf',
    uploadedAt: '2026-03-14T10:24:00Z',
    uploadedAtFormatted: '14 Mar 2026 10:24',
    contextType: 'visit',
    contextTitle: 'Visit · 14 Mar 2026',
    contextLink: '/visits/vis-101',
    patientName: 'Sunita Patil',
    patientClinicId: 'P-0412',
    visitDate: '14 Mar 2026',
    documentType: 'Lab Report',
    overallConfidence: 91,
    status: 'ready',
    rawText: `SHANTI RURAL HEALTH LABORATORY — BIOCHEMISTRY
Patient: Sunita Patil · 42F · P-0412 · Ref: Dr. Asha Rao
Specimen: Venous Blood (Fasting) · Date: 14-03-2026

Total Cholesterol: 184 mg/dL [Desirable < 200 mg/dL]
Serum Triglycerides: 142 mg/dL [Normal < 150 mg/dL]
HDL Cholesterol: 46 mg/dL [Target > 50 mg/dL]
LDL Cholesterol: 110 mg/dL [Optimal < 100 mg/dL]
VLDL Cholesterol: 28.4 mg/dL [Normal 10 - 30 mg/dL]
Total / HDL Ratio: 4.0 [Low Risk < 4.5]

Impression: Borderline LDL elevation with normal triglycerides.
Advise dietary modification, reduce saturated oil, 3-month follow-up.
Verified by: K. Sharma, Senior Lab Technologist`,
    lines: [
      {
        id: 'l1',
        lineNumber: 1,
        rawText: 'SHANTI RURAL HEALTH LABORATORY — BIOCHEMISTRY',
        confidence: 0.99,
        words: [
          { id: 'w1-1', text: 'SHANTI', confidence: 0.99, lowConfidence: false, originalText: 'SHANTI' },
          { id: 'w1-2', text: 'RURAL', confidence: 0.99, lowConfidence: false, originalText: 'RURAL' },
          { id: 'w1-3', text: 'HEALTH', confidence: 0.98, lowConfidence: false, originalText: 'HEALTH' },
          { id: 'w1-4', text: 'LABORATORY', confidence: 0.99, lowConfidence: false, originalText: 'LABORATORY' },
          { id: 'w1-5', text: '—', confidence: 0.99, lowConfidence: false, originalText: '—' },
          { id: 'w1-6', text: 'BIOCHEMISTRY', confidence: 0.97, lowConfidence: false, originalText: 'BIOCHEMISTRY' },
        ],
      },
      {
        id: 'l2',
        lineNumber: 2,
        rawText: 'Patient: Sunita Patil · 42F · P-0412 · Ref: Dr. Asha Rao',
        confidence: 0.98,
        words: [
          { id: 'w2-1', text: 'Patient:', confidence: 0.99, lowConfidence: false, originalText: 'Patient:' },
          { id: 'w2-2', text: 'Sunita', confidence: 0.98, lowConfidence: false, originalText: 'Sunita' },
          { id: 'w2-3', text: 'Patil', confidence: 0.99, lowConfidence: false, originalText: 'Patil' },
          { id: 'w2-4', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'w2-5', text: '42F', confidence: 0.97, lowConfidence: false, originalText: '42F' },
          { id: 'w2-6', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'w2-7', text: 'P-0412', confidence: 0.99, lowConfidence: false, originalText: 'P-0412' },
          { id: 'w2-8', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'w2-9', text: 'Ref:', confidence: 0.98, lowConfidence: false, originalText: 'Ref:' },
          { id: 'w2-10', text: 'Dr.', confidence: 0.99, lowConfidence: false, originalText: 'Dr.' },
          { id: 'w2-11', text: 'Asha', confidence: 0.99, lowConfidence: false, originalText: 'Asha' },
          { id: 'w2-12', text: 'Rao', confidence: 0.99, lowConfidence: false, originalText: 'Rao' },
        ],
      },
      {
        id: 'l3',
        lineNumber: 3,
        rawText: 'Specimen: Venous Blood (Fasting) · Date: 14-03-2026',
        confidence: 0.97,
        words: [
          { id: 'w3-1', text: 'Specimen:', confidence: 0.99, lowConfidence: false, originalText: 'Specimen:' },
          { id: 'w3-2', text: 'Venous', confidence: 0.96, lowConfidence: false, originalText: 'Venous' },
          { id: 'w3-3', text: 'Blood', confidence: 0.98, lowConfidence: false, originalText: 'Blood' },
          { id: 'w3-4', text: '(Fasting)', confidence: 0.95, lowConfidence: false, originalText: '(Fasting)' },
          { id: 'w3-5', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'w3-6', text: 'Date:', confidence: 0.99, lowConfidence: false, originalText: 'Date:' },
          { id: 'w3-7', text: '14-03-2026', confidence: 0.98, lowConfidence: false, originalText: '14-03-2026' },
        ],
      },
      {
        id: 'l4',
        lineNumber: 4,
        rawText: 'Total Cholesterol: 184 mg/dL [Desirable < 200 mg/dL]',
        confidence: 0.96,
        words: [
          { id: 'w4-1', text: 'Total', confidence: 0.99, lowConfidence: false, originalText: 'Total' },
          { id: 'w4-2', text: 'Cholesterol:', confidence: 0.98, lowConfidence: false, originalText: 'Cholesterol:' },
          { id: 'w4-3', text: '184', confidence: 0.95, lowConfidence: false, originalText: '184' },
          { id: 'w4-4', text: 'mg/dL', confidence: 0.98, lowConfidence: false, originalText: 'mg/dL' },
          { id: 'w4-5', text: '[Desirable', confidence: 0.96, lowConfidence: false, originalText: '[Desirable' },
          { id: 'w4-6', text: '<', confidence: 0.98, lowConfidence: false, originalText: '<' },
          { id: 'w4-7', text: '200', confidence: 0.99, lowConfidence: false, originalText: '200' },
          { id: 'w4-8', text: 'mg/dL]', confidence: 0.97, lowConfidence: false, originalText: 'mg/dL]' },
        ],
      },
      {
        id: 'l5',
        lineNumber: 5,
        rawText: 'Serum Triglycerides: 142 mg/dL [Normal < 150 mg/dL]',
        confidence: 0.81,
        words: [
          { id: 'w5-1', text: 'Serum', confidence: 0.98, lowConfidence: false, originalText: 'Serum' },
          { id: 'w5-2', text: 'Triglycerides:', confidence: 0.69, lowConfidence: true, suggestion: 'Triglycerides:', originalText: 'Tnglycerides:' },
          { id: 'w5-3', text: '142', confidence: 0.74, lowConfidence: true, suggestion: '142', originalText: '142' },
          { id: 'w5-4', text: 'mg/dL', confidence: 0.98, lowConfidence: false, originalText: 'mg/dL' },
          { id: 'w5-5', text: '[Normal', confidence: 0.97, lowConfidence: false, originalText: '[Normal' },
          { id: 'w5-6', text: '<', confidence: 0.99, lowConfidence: false, originalText: '<' },
          { id: 'w5-7', text: '150', confidence: 0.99, lowConfidence: false, originalText: '150' },
          { id: 'w5-8', text: 'mg/dL]', confidence: 0.98, lowConfidence: false, originalText: 'mg/dL]' },
        ],
      },
      {
        id: 'l6',
        lineNumber: 6,
        rawText: 'HDL Cholesterol: 46 mg/dL [Target > 50 mg/dL]',
        confidence: 0.94,
        words: [
          { id: 'w6-1', text: 'HDL', confidence: 0.99, lowConfidence: false, originalText: 'HDL' },
          { id: 'w6-2', text: 'Cholesterol:', confidence: 0.98, lowConfidence: false, originalText: 'Cholesterol:' },
          { id: 'w6-3', text: '46', confidence: 0.71, lowConfidence: true, suggestion: '46', originalText: '46' },
          { id: 'w6-4', text: 'mg/dL', confidence: 0.97, lowConfidence: false, originalText: 'mg/dL' },
          { id: 'w6-5', text: '[Target', confidence: 0.96, lowConfidence: false, originalText: '[Target' },
          { id: 'w6-6', text: '>', confidence: 0.98, lowConfidence: false, originalText: '>' },
          { id: 'w6-7', text: '50', confidence: 0.99, lowConfidence: false, originalText: '50' },
          { id: 'w6-8', text: 'mg/dL]', confidence: 0.97, lowConfidence: false, originalText: 'mg/dL]' },
        ],
      },
      {
        id: 'l7',
        lineNumber: 7,
        rawText: 'LDL Cholesterol: 110 mg/dL [Optimal < 100 mg/dL]',
        confidence: 0.79,
        words: [
          { id: 'w7-1', text: 'LDL', confidence: 0.98, lowConfidence: false, originalText: 'LDL' },
          { id: 'w7-2', text: 'Cholesterol:', confidence: 0.97, lowConfidence: false, originalText: 'Cholesterol:' },
          { id: 'w7-3', text: '110', confidence: 0.64, lowConfidence: true, suggestion: '110', originalText: '110' },
          { id: 'w7-4', text: 'mg/dL', confidence: 0.98, lowConfidence: false, originalText: 'mg/dL' },
          { id: 'w7-5', text: '[Optimal', confidence: 0.73, lowConfidence: true, suggestion: '[Optimal', originalText: '[OptimaI' },
          { id: 'w7-6', text: '<', confidence: 0.99, lowConfidence: false, originalText: '<' },
          { id: 'w7-7', text: '100', confidence: 0.99, lowConfidence: false, originalText: '100' },
          { id: 'w7-8', text: 'mg/dL]', confidence: 0.97, lowConfidence: false, originalText: 'mg/dL]' },
        ],
      },
      {
        id: 'l8',
        lineNumber: 8,
        rawText: 'VLDL Cholesterol: 28.4 mg/dL [Normal 10 - 30 mg/dL]',
        confidence: 0.93,
        words: [
          { id: 'w8-1', text: 'VLDL', confidence: 0.95, lowConfidence: false, originalText: 'VLDL' },
          { id: 'w8-2', text: 'Cholesterol:', confidence: 0.98, lowConfidence: false, originalText: 'Cholesterol:' },
          { id: 'w8-3', text: '28.4', confidence: 0.88, lowConfidence: false, originalText: '28.4' },
          { id: 'w8-4', text: 'mg/dL', confidence: 0.98, lowConfidence: false, originalText: 'mg/dL' },
          { id: 'w8-5', text: '[Normal', confidence: 0.97, lowConfidence: false, originalText: '[Normal' },
          { id: 'w8-6', text: '10', confidence: 0.99, lowConfidence: false, originalText: '10' },
          { id: 'w8-7', text: '-', confidence: 0.99, lowConfidence: false, originalText: '-' },
          { id: 'w8-8', text: '30', confidence: 0.99, lowConfidence: false, originalText: '30' },
          { id: 'w8-9', text: 'mg/dL]', confidence: 0.97, lowConfidence: false, originalText: 'mg/dL]' },
        ],
      },
      {
        id: 'l9',
        lineNumber: 9,
        rawText: 'Total / HDL Ratio: 4.0 [Low Risk < 4.5]',
        confidence: 0.97,
        words: [
          { id: 'w9-1', text: 'Total', confidence: 0.99, lowConfidence: false, originalText: 'Total' },
          { id: 'w9-2', text: '/', confidence: 0.99, lowConfidence: false, originalText: '/' },
          { id: 'w9-3', text: 'HDL', confidence: 0.99, lowConfidence: false, originalText: 'HDL' },
          { id: 'w9-4', text: 'Ratio:', confidence: 0.98, lowConfidence: false, originalText: 'Ratio:' },
          { id: 'w9-5', text: '4.0', confidence: 0.97, lowConfidence: false, originalText: '4.0' },
          { id: 'w9-6', text: '[Low', confidence: 0.97, lowConfidence: false, originalText: '[Low' },
          { id: 'w9-7', text: 'Risk', confidence: 0.98, lowConfidence: false, originalText: 'Risk' },
          { id: 'w9-8', text: '<', confidence: 0.99, lowConfidence: false, originalText: '<' },
          { id: 'w9-9', text: '4.5]', confidence: 0.97, lowConfidence: false, originalText: '4.5]' },
        ],
      },
      {
        id: 'l10',
        lineNumber: 10,
        rawText: 'Impression: Borderline LDL elevation with normal triglycerides.',
        confidence: 0.92,
        words: [
          { id: 'w10-1', text: 'Impression:', confidence: 0.98, lowConfidence: false, originalText: 'Impression:' },
          { id: 'w10-2', text: 'Borderline', confidence: 0.92, lowConfidence: false, originalText: 'Borderline' },
          { id: 'w10-3', text: 'LDL', confidence: 0.99, lowConfidence: false, originalText: 'LDL' },
          { id: 'w10-4', text: 'elevation', confidence: 0.91, lowConfidence: false, originalText: 'elevation' },
          { id: 'w10-5', text: 'with', confidence: 0.98, lowConfidence: false, originalText: 'with' },
          { id: 'w10-6', text: 'normal', confidence: 0.97, lowConfidence: false, originalText: 'normal' },
          { id: 'w10-7', text: 'triglycerides.', confidence: 0.88, lowConfidence: false, originalText: 'triglycerides.' },
        ],
      },
      {
        id: 'l11',
        lineNumber: 11,
        rawText: 'Advise dietary modification, reduce saturated oil, 3-month follow-up.',
        confidence: 0.89,
        words: [
          { id: 'w11-1', text: 'Advise', confidence: 0.96, lowConfidence: false, originalText: 'Advise' },
          { id: 'w11-2', text: 'dietary', confidence: 0.94, lowConfidence: false, originalText: 'dietary' },
          { id: 'w11-3', text: 'modification,', confidence: 0.89, lowConfidence: false, originalText: 'modification,' },
          { id: 'w11-4', text: 'reduce', confidence: 0.95, lowConfidence: false, originalText: 'reduce' },
          { id: 'w11-5', text: 'saturated', confidence: 0.72, lowConfidence: true, suggestion: 'saturated', originalText: 'saturlted' },
          { id: 'w11-6', text: 'oil,', confidence: 0.97, lowConfidence: false, originalText: 'oil,' },
          { id: 'w11-7', text: '3-month', confidence: 0.95, lowConfidence: false, originalText: '3-month' },
          { id: 'w11-8', text: 'follow-up.', confidence: 0.93, lowConfidence: false, originalText: 'follow-up.' },
        ],
      },
      {
        id: 'l12',
        lineNumber: 12,
        rawText: 'Verified by: K. Sharma, Senior Lab Technologist',
        confidence: 0.96,
        words: [
          { id: 'w12-1', text: 'Verified', confidence: 0.98, lowConfidence: false, originalText: 'Verified' },
          { id: 'w12-2', text: 'by:', confidence: 0.99, lowConfidence: false, originalText: 'by:' },
          { id: 'w12-3', text: 'K.', confidence: 0.98, lowConfidence: false, originalText: 'K.' },
          { id: 'w12-4', text: 'Sharma,', confidence: 0.97, lowConfidence: false, originalText: 'Sharma,' },
          { id: 'w12-5', text: 'Senior', confidence: 0.96, lowConfidence: false, originalText: 'Senior' },
          { id: 'w12-6', text: 'Lab', confidence: 0.99, lowConfidence: false, originalText: 'Lab' },
          { id: 'w12-7', text: 'Technologist', confidence: 0.94, lowConfidence: false, originalText: 'Technologist' },
        ],
      },
    ],
  },
  'att-seed-2': {
    id: 'att-seed-2',
    filename: 'rx_handwritten_card_sep2026.jpg',
    fileSizeBytes: 860160,
    fileSizeFormatted: '840 KB',
    fileType: 'jpg',
    uploadedAt: '2026-09-19T08:50:00Z',
    uploadedAtFormatted: '19 Sep 2026 08:50',
    contextType: 'patient',
    contextTitle: 'Anandi Devi · KAY-26-0104',
    contextLink: '/patients/pat-1',
    patientName: 'Anandi Devi',
    patientClinicId: 'KAY-26-0104',
    documentType: 'Prescription',
    overallConfidence: 87,
    status: 'ready',
    rawText: `PRIMARY HEALTH CENTRE · OUTPATIENT RX
Patient: Anandi Devi · Age 48F · Reg: KAY-26-0104
Date: 19-09-2026

Rx:
1. Tab. Amlodipine 5 mg — 1 tab OD (morning) x 30 days
2. Tab. Hydrochlorothiazide 12.5 mg — 1 tab OD x 30 days
3. Tab. Paracetamol 500 mg — SOS for occipital headache

Advice: Low salt diet (< 5g/day). Weekly BP monitoring at sub-centre.
Next review: 18-10-2026
Dr. Asha Rao, MBBS`,
    lines: [
      {
        id: 'r1',
        lineNumber: 1,
        rawText: 'PRIMARY HEALTH CENTRE · OUTPATIENT RX',
        confidence: 0.98,
        words: [
          { id: 'rw1-1', text: 'PRIMARY', confidence: 0.98, lowConfidence: false, originalText: 'PRIMARY' },
          { id: 'rw1-2', text: 'HEALTH', confidence: 0.98, lowConfidence: false, originalText: 'HEALTH' },
          { id: 'rw1-3', text: 'CENTRE', confidence: 0.97, lowConfidence: false, originalText: 'CENTRE' },
          { id: 'rw1-4', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'rw1-5', text: 'OUTPATIENT', confidence: 0.96, lowConfidence: false, originalText: 'OUTPATIENT' },
          { id: 'rw1-6', text: 'RX', confidence: 0.99, lowConfidence: false, originalText: 'RX' },
        ],
      },
      {
        id: 'r2',
        lineNumber: 2,
        rawText: 'Patient: Anandi Devi · Age 48F · Reg: KAY-26-0104',
        confidence: 0.96,
        words: [
          { id: 'rw2-1', text: 'Patient:', confidence: 0.99, lowConfidence: false, originalText: 'Patient:' },
          { id: 'rw2-2', text: 'Anandi', confidence: 0.97, lowConfidence: false, originalText: 'Anandi' },
          { id: 'rw2-3', text: 'Devi', confidence: 0.98, lowConfidence: false, originalText: 'Devi' },
          { id: 'rw2-4', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'rw2-5', text: 'Age', confidence: 0.98, lowConfidence: false, originalText: 'Age' },
          { id: 'rw2-6', text: '48F', confidence: 0.96, lowConfidence: false, originalText: '48F' },
          { id: 'rw2-7', text: '·', confidence: 0.99, lowConfidence: false, originalText: '·' },
          { id: 'rw2-8', text: 'Reg:', confidence: 0.98, lowConfidence: false, originalText: 'Reg:' },
          { id: 'rw2-9', text: 'KAY-26-0104', confidence: 0.98, lowConfidence: false, originalText: 'KAY-26-0104' },
        ],
      },
      {
        id: 'r3',
        lineNumber: 3,
        rawText: 'Date: 19-09-2026',
        confidence: 0.99,
        words: [
          { id: 'rw3-1', text: 'Date:', confidence: 0.99, lowConfidence: false, originalText: 'Date:' },
          { id: 'rw3-2', text: '19-09-2026', confidence: 0.99, lowConfidence: false, originalText: '19-09-2026' },
        ],
      },
      {
        id: 'r4',
        lineNumber: 4,
        rawText: 'Rx:',
        confidence: 0.99,
        words: [{ id: 'rw4-1', text: 'Rx:', confidence: 0.99, lowConfidence: false, originalText: 'Rx:' }],
      },
      {
        id: 'r5',
        lineNumber: 5,
        rawText: '1. Tab. Amlodipine 5 mg — 1 tab OD (morning) x 30 days',
        confidence: 0.78,
        words: [
          { id: 'rw5-1', text: '1.', confidence: 0.99, lowConfidence: false, originalText: '1.' },
          { id: 'rw5-2', text: 'Tab.', confidence: 0.98, lowConfidence: false, originalText: 'Tab.' },
          { id: 'rw5-3', text: 'Amlodipine', confidence: 0.71, lowConfidence: true, suggestion: 'Amlodipine', originalText: 'Amlodipine' },
          { id: 'rw5-4', text: '5', confidence: 0.97, lowConfidence: false, originalText: '5' },
          { id: 'rw5-5', text: 'mg', confidence: 0.98, lowConfidence: false, originalText: 'mg' },
          { id: 'rw5-6', text: '—', confidence: 0.99, lowConfidence: false, originalText: '—' },
          { id: 'rw5-7', text: '1', confidence: 0.98, lowConfidence: false, originalText: '1' },
          { id: 'rw5-8', text: 'tab', confidence: 0.97, lowConfidence: false, originalText: 'tab' },
          { id: 'rw5-9', text: 'OD', confidence: 0.74, lowConfidence: true, suggestion: 'OD', originalText: '0D' },
          { id: 'rw5-10', text: '(morning)', confidence: 0.94, lowConfidence: false, originalText: '(morning)' },
          { id: 'rw5-11', text: 'x', confidence: 0.98, lowConfidence: false, originalText: 'x' },
          { id: 'rw5-12', text: '30', confidence: 0.99, lowConfidence: false, originalText: '30' },
          { id: 'rw5-13', text: 'days', confidence: 0.97, lowConfidence: false, originalText: 'days' },
        ],
      },
      {
        id: 'r6',
        lineNumber: 6,
        rawText: '2. Tab. Hydrochlorothiazide 12.5 mg — 1 tab OD x 30 days',
        confidence: 0.73,
        words: [
          { id: 'rw6-1', text: '2.', confidence: 0.99, lowConfidence: false, originalText: '2.' },
          { id: 'rw6-2', text: 'Tab.', confidence: 0.98, lowConfidence: false, originalText: 'Tab.' },
          { id: 'rw6-3', text: 'Hydrochlorothiazide', confidence: 0.65, lowConfidence: true, suggestion: 'Hydrochlorothiazide', originalText: 'Hydrochlorothiazide' },
          { id: 'rw6-4', text: '12.5', confidence: 0.94, lowConfidence: false, originalText: '12.5' },
          { id: 'rw6-5', text: 'mg', confidence: 0.98, lowConfidence: false, originalText: 'mg' },
          { id: 'rw6-6', text: '—', confidence: 0.99, lowConfidence: false, originalText: '—' },
          { id: 'rw6-7', text: '1', confidence: 0.99, lowConfidence: false, originalText: '1' },
          { id: 'rw6-8', text: 'tab', confidence: 0.97, lowConfidence: false, originalText: 'tab' },
          { id: 'rw6-9', text: 'OD', confidence: 0.96, lowConfidence: false, originalText: 'OD' },
          { id: 'rw6-10', text: 'x', confidence: 0.98, lowConfidence: false, originalText: 'x' },
          { id: 'rw6-11', text: '30', confidence: 0.99, lowConfidence: false, originalText: '30' },
          { id: 'rw6-12', text: 'days', confidence: 0.98, lowConfidence: false, originalText: 'days' },
        ],
      },
      {
        id: 'r7',
        lineNumber: 7,
        rawText: '3. Tab. Paracetamol 500 mg — SOS for occipital headache',
        confidence: 0.88,
        words: [
          { id: 'rw7-1', text: '3.', confidence: 0.99, lowConfidence: false, originalText: '3.' },
          { id: 'rw7-2', text: 'Tab.', confidence: 0.98, lowConfidence: false, originalText: 'Tab.' },
          { id: 'rw7-3', text: 'Paracetamol', confidence: 0.95, lowConfidence: false, originalText: 'Paracetamol' },
          { id: 'rw7-4', text: '500', confidence: 0.99, lowConfidence: false, originalText: '500' },
          { id: 'rw7-5', text: 'mg', confidence: 0.98, lowConfidence: false, originalText: 'mg' },
          { id: 'rw7-6', text: '—', confidence: 0.99, lowConfidence: false, originalText: '—' },
          { id: 'rw7-7', text: 'SOS', confidence: 0.77, lowConfidence: true, suggestion: 'SOS', originalText: 'S.O.S.' },
          { id: 'rw7-8', text: 'for', confidence: 0.98, lowConfidence: false, originalText: 'for' },
          { id: 'rw7-9', text: 'occipital', confidence: 0.76, lowConfidence: true, suggestion: 'occipital', originalText: 'occipital' },
          { id: 'rw7-10', text: 'headache', confidence: 0.94, lowConfidence: false, originalText: 'headache' },
        ],
      },
      {
        id: 'r8',
        lineNumber: 8,
        rawText: 'Advice: Low salt diet (< 5g/day). Weekly BP monitoring at sub-centre.',
        confidence: 0.94,
        words: [
          { id: 'rw8-1', text: 'Advice:', confidence: 0.98, lowConfidence: false, originalText: 'Advice:' },
          { id: 'rw8-2', text: 'Low', confidence: 0.98, lowConfidence: false, originalText: 'Low' },
          { id: 'rw8-3', text: 'salt', confidence: 0.96, lowConfidence: false, originalText: 'salt' },
          { id: 'rw8-4', text: 'diet', confidence: 0.97, lowConfidence: false, originalText: 'diet' },
          { id: 'rw8-5', text: '(<', confidence: 0.99, lowConfidence: false, originalText: '(<' },
          { id: 'rw8-6', text: '5g/day).', confidence: 0.95, lowConfidence: false, originalText: '5g/day).' },
          { id: 'rw8-7', text: 'Weekly', confidence: 0.97, lowConfidence: false, originalText: 'Weekly' },
          { id: 'rw8-8', text: 'BP', confidence: 0.99, lowConfidence: false, originalText: 'BP' },
          { id: 'rw8-9', text: 'monitoring', confidence: 0.94, lowConfidence: false, originalText: 'monitoring' },
          { id: 'rw8-10', text: 'at', confidence: 0.99, lowConfidence: false, originalText: 'at' },
          { id: 'rw8-11', text: 'sub-centre.', confidence: 0.96, lowConfidence: false, originalText: 'sub-centre.' },
        ],
      },
      {
        id: 'r9',
        lineNumber: 9,
        rawText: 'Next review: 18-10-2026',
        confidence: 0.99,
        words: [
          { id: 'rw9-1', text: 'Next', confidence: 0.99, lowConfidence: false, originalText: 'Next' },
          { id: 'rw9-2', text: 'review:', confidence: 0.99, lowConfidence: false, originalText: 'review:' },
          { id: 'rw9-3', text: '18-10-2026', confidence: 0.99, lowConfidence: false, originalText: '18-10-2026' },
        ],
      },
      {
        id: 'r10',
        lineNumber: 10,
        rawText: 'Dr. Asha Rao, MBBS',
        confidence: 0.98,
        words: [
          { id: 'rw10-1', text: 'Dr.', confidence: 0.99, lowConfidence: false, originalText: 'Dr.' },
          { id: 'rw10-2', text: 'Asha', confidence: 0.99, lowConfidence: false, originalText: 'Asha' },
          { id: 'rw10-3', text: 'Rao,', confidence: 0.98, lowConfidence: false, originalText: 'Rao,' },
          { id: 'rw10-4', text: 'MBBS', confidence: 0.97, lowConfidence: false, originalText: 'MBBS' },
        ],
      },
    ],
  },
};

export function getAttachmentById(id: string): AttachmentRecord {
  if (MOCK_ATTACHMENTS[id]) {
    return JSON.parse(JSON.stringify(MOCK_ATTACHMENTS[id]));
  }
  // Default fallback
  const fallback = MOCK_ATTACHMENTS['att-seed-1'];
  return {
    ...fallback,
    id,
    filename: `document_${id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
  };
}
